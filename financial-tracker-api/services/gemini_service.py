import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL_NAME = "gemini-2.5-flash"
GEMINI_RATE_LIMIT_COOLDOWN_SECONDS = 300
GEMINI_CONNECT_TIMEOUT_SECONDS = 10
GEMINI_READ_TIMEOUT_SECONDS = 45
GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL_NAME}:generateContent"
)

_ALLOWED_RECOMMENDATION_TYPES = {"budget", "sales", "inventory", "savings", "alert"}

gemini_disabled_until = 0.0
gemini_disabled_reason = ""


def _is_rate_limited_error(error):
    message = str(error).lower()
    patterns = (
        "429",
        "quota",
        "rate limit",
        "rate_limit",
        "too many requests",
        "resource exhausted",
        "resource_exhausted",
    )
    return any(pattern in message for pattern in patterns)


def _set_gemini_cooldown(reason):
    global gemini_disabled_until, gemini_disabled_reason
    gemini_disabled_until = time.time() + GEMINI_RATE_LIMIT_COOLDOWN_SECONDS
    gemini_disabled_reason = str(reason)


def _is_gemini_temporarily_disabled():
    return time.time() < gemini_disabled_until


def _safe_float(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _format_currency(amount):
    return f"P{amount:,.2f}"


def _empty_business_context():
    return {
        "storage": [],
        "sales": [],
        "transaction_summary": [],
        "recent_transactions": [],
        "total_income": 0.0,
        "total_expense": 0.0,
        "balance": 0.0,
        "low_stock": [],
        "expense_by_category": [],
        "income_by_category": [],
        "transaction_count": 0,
        "latest_transaction_date": None,
        "latest_income_total": 0.0,
    }


def _sort_inventory_items(items):
    priority = {"CRITICAL": 0, "LOW": 1, "OK": 2}
    return sorted(
        items,
        key=lambda item: (
            priority.get((item.get("status") or "OK").upper(), 3),
            _safe_float(item.get("current_stock")),
            str(item.get("item_name", "")).lower(),
        ),
    )


def _get_low_stock_items(storage):
    low_items = []
    for item in storage:
        current_stock = _safe_float(item.get("current_stock"))
        min_level = _safe_float(item.get("min_level"))
        status = (item.get("status") or "OK").upper()
        if status in {"LOW", "CRITICAL"} or current_stock <= min_level:
            display_item = dict(item)
            if status == "OK" and current_stock <= min_level:
                display_item["status"] = "LOW"
            low_items.append(display_item)
    return _sort_inventory_items(low_items)


def _get_critical_stock_items(storage):
    critical_items = []
    for item in storage:
        current_stock = _safe_float(item.get("current_stock"))
        min_level = _safe_float(item.get("min_level"))
        status = (item.get("status") or "OK").upper()
        if status == "CRITICAL" or current_stock == 0 or (
            min_level > 0 and current_stock < (min_level * 0.5)
        ):
            display_item = dict(item)
            display_item["status"] = "CRITICAL"
            critical_items.append(display_item)
    return _sort_inventory_items(critical_items)


def _get_latest_business_date(data):
    if data.get("latest_transaction_date"):
        return data["latest_transaction_date"]

    for transaction in data.get("recent_transactions", []):
        if transaction.get("date"):
            return transaction["date"]

    return None


def _clean_response_text(raw_text):
    if not isinstance(raw_text, str):
        return ""

    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else ""
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()


def _extract_error_message(response):
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    error_payload = payload.get("error") if isinstance(payload, dict) else payload
    if isinstance(error_payload, dict):
        code = error_payload.get("code")
        status = error_payload.get("status")
        message = error_payload.get("message") or response.text.strip()
        parts = [f"HTTP {response.status_code}"]
        if code:
            parts.append(f"code={code}")
        if status:
            parts.append(str(status))
        if message:
            parts.append(message)
        return " | ".join(parts)

    fallback_message = response.text.strip() or "Unknown Gemini API error."
    return f"HTTP {response.status_code} | {fallback_message}"


def _extract_text_from_response(response_data):
    candidates = response_data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned no candidates.")

    first_candidate = candidates[0]
    parts = first_candidate.get("content", {}).get("parts") or []
    text = "".join(
        part.get("text", "")
        for part in parts
        if isinstance(part, dict) and part.get("text")
    )

    cleaned_text = _clean_response_text(text)
    if cleaned_text:
        return cleaned_text

    finish_reason = first_candidate.get("finishReason")
    if finish_reason:
        raise RuntimeError(
            f"Gemini returned no text output (finish reason: {finish_reason})."
        )

    raise RuntimeError("Gemini returned no text output.")


def _build_system_instruction(context, purpose=None):
    base_instruction = f"""{SYSTEM_PROMPT}

Use the business data below as the source of truth for every answer.
If the available records are incomplete, say so clearly instead of inventing values.

{context}"""

    if purpose == "recommendations":
        base_instruction += (
            "\n\nYou are preparing short, actionable dashboard recommendation cards. "
            "Keep them concise, specific, and ready for the UI."
        )

    return base_instruction


def _build_chat_contents(message, history=None):
    contents = []

    for item in (history or [])[-8:]:
        text = str(item.get("content", "")).strip()
        if not text:
            continue

        role = "user" if item.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": str(message).strip()}]})
    return contents


def _call_gemini_api(
    contents,
    system_instruction,
    *,
    response_mime_type="text/plain",
    temperature=0.5,
    max_output_tokens=1024,
):
    if not API_KEY:
        raise RuntimeError("Missing GOOGLE_API_KEY.")

    if _is_gemini_temporarily_disabled():
        raise RuntimeError(
            "Gemini is temporarily cooling down after a rate-limit response."
        )

    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        },
    }

    if response_mime_type:
        payload["generationConfig"]["responseMimeType"] = response_mime_type

    try:
        response = requests.post(
            GEMINI_API_URL,
            params={"key": API_KEY},
            json=payload,
            timeout=(GEMINI_CONNECT_TIMEOUT_SECONDS, GEMINI_READ_TIMEOUT_SECONDS),
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"Unable to reach the Gemini API: {exc}") from exc

    if not response.ok:
        error_message = _extract_error_message(response)
        if _is_rate_limited_error(error_message):
            _set_gemini_cooldown(error_message)
        raise RuntimeError(error_message)

    try:
        response_data = response.json()
    except ValueError as exc:
        raise RuntimeError("Gemini returned invalid JSON.") from exc

    return _extract_text_from_response(response_data)


def _build_recommendation(title, text, recommendation_type):
    normalized_type = recommendation_type if recommendation_type in _ALLOWED_RECOMMENDATION_TYPES else "budget"
    return {
        "title": str(title).strip()[:40],
        "text": str(text).strip(),
        "type": normalized_type,
    }


def _build_fallback_recommendations(data):
    recommendations = []
    expense_by_category = data.get("expense_by_category", [])
    income_by_category = data.get("income_by_category", [])
    sales = data.get("sales", [])
    storage = data.get("storage", [])
    low_items = _get_low_stock_items(storage)
    critical_items = _get_critical_stock_items(storage)
    balance = _safe_float(data.get("balance"))
    total_income = _safe_float(data.get("total_income"))
    total_expense = _safe_float(data.get("total_expense"))
    latest_income_total = _safe_float(data.get("latest_income_total"))
    latest_date = _get_latest_business_date(data)
    transaction_count = int(data.get("transaction_count") or 0)

    if expense_by_category:
        top_expense = expense_by_category[0]
        recommendations.append(
            _build_recommendation(
                "Watch top expenses",
                (
                    f"{top_expense['category']} already accounts for "
                    f"{_format_currency(top_expense['total'])} across {top_expense['entries']} "
                    f"expense record(s). Start trimming this category first to protect your budget."
                ),
                "budget",
            )
        )
    else:
        recommendations.append(
            _build_recommendation(
                "Categorize expenses",
                "Add clear categories to each expense so the dashboard can identify which costs need the most attention.",
                "budget",
            )
        )

    if critical_items:
        sample_names = ", ".join(item.get("item_name", "Item") for item in critical_items[:3])
        recommendations.append(
            _build_recommendation(
                "Urgent restock needed",
                (
                    f"{len(critical_items)} item(s) are already critical, including {sample_names}. "
                    "Restock these first to reduce the risk of missed sales."
                ),
                "alert",
            )
        )
    elif low_items:
        sample_names = ", ".join(item.get("item_name", "Item") for item in low_items[:3])
        recommendations.append(
            _build_recommendation(
                "Schedule restocking",
                (
                    f"{len(low_items)} item(s) are below their preferred stock level, led by {sample_names}. "
                    "Plan a restock run before they become critical."
                ),
                "inventory",
            )
        )
    else:
        recommendations.append(
            _build_recommendation(
                "Inventory is stable",
                "No items are currently flagged as LOW or CRITICAL, so you can focus on maintaining your usual reorder cycle.",
                "inventory",
            )
        )

    if balance > 0 and total_income > 0:
        reserve_target = round(balance * 0.10, 2)
        recommendations.append(
            _build_recommendation(
                "Protect a reserve",
                (
                    f"With a current balance of {_format_currency(balance)}, setting aside about "
                    f"{_format_currency(reserve_target)} would give the store a healthier cash buffer."
                ),
                "savings",
            )
        )
    else:
        recommendations.append(
            _build_recommendation(
                "Stabilize cash flow",
                (
                    f"Current balance is {_format_currency(balance)} against {_format_currency(total_expense)} "
                    "in expenses. Focus on protecting cash before committing to new spending."
                ),
                "savings",
            )
        )

    if income_by_category:
        top_income = income_by_category[0]
        recommendations.append(
            _build_recommendation(
                "Support strong income",
                (
                    f"{top_income['category']} has contributed {_format_currency(top_income['total'])}. "
                    "Keep this source visible and well-supported while you grow the others."
                ),
                "sales",
            )
        )
    elif sales:
        top_sale = sales[0]
        recommendations.append(
            _build_recommendation(
                "Track best seller",
                (
                    f"{top_sale['item_name']} leads recorded sales with {top_sale['total_sold']} unit(s) sold. "
                    "Use it as a guide for restock timing and promotions."
                ),
                "sales",
            )
        )
    else:
        recommendations.append(
            _build_recommendation(
                "Strengthen sales records",
                "Add more sales entries so the assistant can spot your best performers and build stronger budget guidance.",
                "sales",
            )
        )

    if latest_income_total > 0 and latest_date:
        recommendations.append(
            _build_recommendation(
                "Review latest income day",
                (
                    f"Recorded income for {latest_date} reached {_format_currency(latest_income_total)}. "
                    "Use that day as a benchmark when planning the next budget cycle."
                ),
                "alert",
            )
        )
    elif transaction_count > 0:
        recommendations.append(
            _build_recommendation(
                "Keep records current",
                (
                    f"You now have {transaction_count} recorded transaction(s). "
                    "Continue logging daily activity so forecasts and assistant answers stay accurate."
                ),
                "alert",
            )
        )
    else:
        recommendations.append(
            _build_recommendation(
                "Add first records",
                "Start recording transactions and inventory movement so the recommendation panel can become more specific.",
                "alert",
            )
        )

    unique_recommendations = []
    seen_titles = set()
    for recommendation in recommendations:
        title_key = recommendation["title"].lower()
        if title_key in seen_titles:
            continue
        seen_titles.add(title_key)
        unique_recommendations.append(recommendation)

    return unique_recommendations[:5]


def _normalize_recommendations(raw_recommendations, data):
    normalized = []

    if isinstance(raw_recommendations, list):
        for item in raw_recommendations:
            if not isinstance(item, dict):
                continue

            title = str(item.get("title", "")).strip()
            text = str(item.get("text", "")).strip()
            recommendation_type = str(item.get("type", "budget")).strip().lower()

            if not title or not text:
                continue

            normalized.append(
                _build_recommendation(title, text, recommendation_type)
            )

    fallback_recommendations = _build_fallback_recommendations(data)
    existing_titles = {item["title"].lower() for item in normalized}

    for fallback in fallback_recommendations:
        if len(normalized) >= 5:
            break
        if fallback["title"].lower() in existing_titles:
            continue
        normalized.append(fallback)
        existing_titles.add(fallback["title"].lower())

    return normalized[:5]


def load_business_context():
    """Fetch real-time business data for assistant analysis."""

    from database.db import execute, get_db, get_table_columns

    conn = get_db()
    cursor = conn.cursor()

    txn_columns = get_table_columns(cursor, "transactions")

    execute(cursor, "SELECT item_name, current_stock, min_level, unit, status FROM storage")
    storage = [dict(row) for row in cursor.fetchall()]

    execute(
        cursor,
        """
        SELECT item_name, SUM(quantity) AS total_sold
        FROM sales
        GROUP BY item_name
        ORDER BY total_sold DESC
        """
    )
    sales = [dict(row) for row in cursor.fetchall()]

    execute(cursor, "SELECT type, SUM(amount) AS total FROM transactions GROUP BY type")
    transaction_summary = [dict(row) for row in cursor.fetchall()]

    execute(cursor, "SELECT COUNT(*) AS count FROM transactions")
    transaction_count = cursor.fetchone()["count"]

    execute(
        cursor,
        """
        SELECT date
        FROM transactions
        WHERE date IS NOT NULL AND TRIM(date) != ''
        ORDER BY date DESC, id DESC
        LIMIT 1
        """
    )
    latest_transaction_row = cursor.fetchone()
    latest_transaction_date = (
        latest_transaction_row["date"] if latest_transaction_row else None
    )

    latest_income_total = 0.0
    if latest_transaction_date:
        execute(
            cursor,
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM transactions
            WHERE type = 'income' AND date = ?
            """,
            (latest_transaction_date,),
        )
        latest_income_total = _safe_float(cursor.fetchone()["total"])

    execute(
        cursor,
        """
        SELECT category, SUM(amount) AS total, COUNT(*) AS entries
        FROM transactions
        WHERE type = 'expense' AND category IS NOT NULL AND TRIM(category) != ''
        GROUP BY category
        ORDER BY ABS(SUM(amount)) DESC
        """
    )
    expense_by_category = [
        {
            "category": row["category"],
            "total": abs(_safe_float(row["total"])),
            "entries": row["entries"],
        }
        for row in cursor.fetchall()
    ]

    execute(
        cursor,
        """
        SELECT category, SUM(amount) AS total, COUNT(*) AS entries
        FROM transactions
        WHERE type = 'income' AND category IS NOT NULL AND TRIM(category) != ''
        GROUP BY category
        ORDER BY SUM(amount) DESC
        """
    )
    income_by_category = [
        {
            "category": row["category"],
            "total": _safe_float(row["total"]),
            "entries": row["entries"],
        }
        for row in cursor.fetchall()
    ]

    select_cols = []
    for col in ["id", "type", "amount", "date", "note", "category", "to_name"]:
        if col in txn_columns:
            select_cols.append(col)

    if select_cols:
        cols_str = ", ".join(select_cols)
        execute(
            cursor,
            f"SELECT {cols_str} FROM transactions ORDER BY date DESC, id DESC LIMIT 20"
        )
        recent_transactions = [dict(row) for row in cursor.fetchall()]
    else:
        recent_transactions = []

    total_income = 0.0
    total_expense = 0.0
    for entry in transaction_summary:
        total = _safe_float(entry["total"])
        if entry["type"] == "income":
            total_income = total
        elif entry["type"] == "expense":
            total_expense = abs(total)

    balance = round(total_income - total_expense, 2)

    low_stock = [
        {"name": item["item_name"], "stock": item["current_stock"], "min": item["min_level"]}
        for item in storage
        if item["current_stock"] <= item["min_level"]
    ]

    conn.close()

    return {
        "storage": storage,
        "sales": sales,
        "transaction_summary": transaction_summary,
        "recent_transactions": recent_transactions,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": balance,
        "low_stock": low_stock,
        "expense_by_category": expense_by_category,
        "income_by_category": income_by_category,
        "transaction_count": transaction_count,
        "latest_transaction_date": latest_transaction_date,
        "latest_income_total": round(latest_income_total, 2),
    }


def build_context_prompt(data):
    """Convert business data into a readable prompt section."""

    if data["storage"]:
        inventory_lines = []
        for item in data["storage"]:
            status_flag = " LOW" if item["current_stock"] <= item["min_level"] else ""
            inventory_lines.append(
                f"  - {item['item_name']}: {item['current_stock']} {item.get('unit', 'pcs')} "
                f"(min: {item['min_level']}){status_flag}"
            )
        inventory_text = "\n".join(inventory_lines)
    else:
        inventory_text = "  No inventory data available."

    if data["sales"]:
        sales_lines = [
            f"  - {sale['item_name']}: {sale['total_sold']} units sold"
            for sale in data["sales"][:10]
        ]
        sales_text = "\n".join(sales_lines)
    else:
        sales_text = "  No sales data available."

    if data["recent_transactions"]:
        txn_lines = []
        for transaction in data["recent_transactions"][:15]:
            parts = []
            if "date" in transaction and transaction["date"]:
                parts.append(transaction["date"])
            if "type" in transaction and transaction["type"]:
                parts.append(transaction["type"].upper())
            if "amount" in transaction and transaction["amount"] is not None:
                parts.append(f"P{abs(transaction['amount']):,.2f}")
            if "category" in transaction and transaction.get("category"):
                parts.append(transaction["category"])
            if "to_name" in transaction and transaction.get("to_name"):
                parts.append(transaction["to_name"])
            if "note" in transaction and transaction.get("note"):
                parts.append(transaction["note"])
            txn_lines.append("  - " + " | ".join(parts))
        txn_text = "\n".join(txn_lines)
    else:
        txn_text = "  No recent transactions."

    if data["low_stock"]:
        low_lines = [
            f"  - {item['name']}: only {item['stock']} left (minimum: {item['min']})"
            for item in data["low_stock"]
        ]
        low_text = "\n".join(low_lines)
    else:
        low_text = "  All items are sufficiently stocked."

    return f"""
=== CURRENT BUSINESS DATA ===

FINANCIAL OVERVIEW:
  - Total Income: P{data['total_income']:,.2f}
  - Total Expenses: P{data['total_expense']:,.2f}
  - Current Balance: P{data['balance']:,.2f}

INVENTORY ({len(data['storage'])} items):
{inventory_text}

TOP SALES:
{sales_text}

RECENT TRANSACTIONS:
{txn_text}

LOW STOCK ALERTS:
{low_text}
"""


SYSTEM_PROMPT = """You are a smart, professional Financial Assistant for a small retail store called \"Gerald Retail Store\".

YOUR ROLE:
- Analyze the store's real financial data provided below
- Give specific, actionable advice based on actual numbers
- Help with budget planning, expense tracking, restock decisions, and sales analysis
- Provide predictions and recommendations grounded in the data

RESPONSE STYLE:
- Be concise but thorough (2-4 short paragraphs max unless asked for detail)
- Use peso sign (P) for currency
- Reference specific numbers from the data when relevant
- Use bullet points for lists when they improve clarity
- Be friendly and professional
- If data is insufficient for a question, say so honestly and suggest what data to add
- Do NOT make up numbers; only use what is provided in the business data

CAPABILITIES:
- Expense analysis and categorization
- Budget recommendations and predictions
- Inventory restock suggestions with urgency levels
- Sales trend analysis
- Savings and cash flow advice
- Financial goal setting
"""


def ask_gemini(message, history=None):
    """Send a message to Gemini with full business context."""

    try:
        data = load_business_context()
    except Exception as exc:
        print("Business Context Error:", exc)
        data = _empty_business_context()

    if not API_KEY:
        return (
            "AI assistant is unavailable right now because the Gemini API key is missing. "
            "Add a valid GOOGLE_API_KEY and restart the backend."
        )

    if _is_gemini_temporarily_disabled():
        return (
            "AI assistant is temporarily unavailable because the Gemini service is cooling down "
            "after a rate-limit response. Please try again in a few minutes."
        )

    try:
        context = build_context_prompt(data)
        system_instruction = _build_system_instruction(context)
        contents = _build_chat_contents(message, history)
        return _call_gemini_api(
            contents,
            system_instruction,
            response_mime_type="text/plain",
            temperature=0.55,
            max_output_tokens=1200,
        )
    except Exception as exc:
        print("AI Error:", exc)
        if _is_rate_limited_error(exc):
            _set_gemini_cooldown(exc)
        return (
            "AI assistant is temporarily unavailable right now. Please verify the Gemini API key "
            "and internet connection, then try again."
        )



def generate_recommendations():
    """Generate recommendation cards using Gemini, with a data-driven fallback."""

    try:
        data = load_business_context()
    except Exception as exc:
        print("Recommendation Context Error:", exc)
        data = _empty_business_context()

    fallback_recommendations = _build_fallback_recommendations(data)

    if not API_KEY or _is_gemini_temporarily_disabled():
        return fallback_recommendations

    prompt = """Generate exactly 5 short financial recommendations for the dashboard.

Return only a valid JSON array using this schema:
[
  {"title": "Short Title", "text": "1-2 sentence recommendation using actual values from the data.", "type": "budget|sales|inventory|savings|alert"}
]

Rules:
- No markdown
- No code fences
- Keep each title short and readable
- Keep each text concise for a dashboard card
- Mention real numbers when useful
"""

    try:
        context = build_context_prompt(data)
        system_instruction = _build_system_instruction(context, purpose="recommendations")
        raw_response = _call_gemini_api(
            [{"role": "user", "parts": [{"text": prompt}]}],
            system_instruction,
            response_mime_type="application/json",
            temperature=0.35,
            max_output_tokens=900,
        )
        parsed_recommendations = json.loads(_clean_response_text(raw_response))
        return _normalize_recommendations(parsed_recommendations, data)
    except Exception as exc:
        print("Recommendation Error:", exc)
        if _is_rate_limited_error(exc):
            _set_gemini_cooldown(exc)
        return fallback_recommendations
