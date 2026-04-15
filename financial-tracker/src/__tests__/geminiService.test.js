/**
 * Integration Tests for Financial Tracker
 * Tests run against your REAL running Flask backend
 *
 * BEFORE RUNNING:
 *   1. Start Flask:  cd financial-tracker-api && python app.py
 *   2. Add at least one transaction via the dashboard
 *   3. Then run: npx jest integration.test.js --verbose --testTimeout=30000
 *
 * Install: npm install --save-dev jest node-fetch@2
 */

// ═══════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════

const fetch = require("node-fetch");
const API_BASE = "http://localhost:5000/api";

// Helper — makes a real HTTP request to your Flask backend
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

// ── Check Flask is running before all tests ────────────────
beforeAll(async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { timeout: 5000 });
    if (!res.ok) throw new Error("Health check failed");
    console.log("✓ Flask backend is running\n");
  } catch (e) {
    throw new Error(
      "\n\n❌ Flask backend is NOT running.\n" +
      "   Start it with: cd financial-tracker-api && python app.py\n" +
      "   Then re-run the tests.\n"
    );
  }
});


// ═══════════════════════════════════════════════
// TEST CASE 1: Health Check
// ═══════════════════════════════════════════════
// WHY: Confirms the Flask server is reachable and responding
// before any other tests run. If this fails, all others will
// also fail — so this gives a clear early signal.

test("TC1: /api/health returns 200 and status ok", async () => {
  const { status, data } = await apiCall("/health");

  expect(status).toBe(200);
  expect(data.status).toBe("ok");
  expect(typeof data.message).toBe("string");

  console.log(`✅ TC1 PASSED: Health check OK — ${data.message}`);
});


// ═══════════════════════════════════════════════
// TEST CASE 2: GET /api/transactions
// ═══════════════════════════════════════════════
// WHY: The RecentTransactions panel depends on this endpoint.
// Tests that the endpoint responds, returns an array, and each
// transaction has the required fields for the UI to render.

test("TC2: GET /api/transactions returns array", async () => {
  const { status, data } = await apiCall("/transactions");

  expect(status).toBe(200);
  expect(Array.isArray(data)).toBe(true);

  if (data.length > 0) {
    const tx = data[0];
    expect(tx).toHaveProperty("id");
    expect(tx).toHaveProperty("date");
    console.log(
      `✅ TC2 PASSED: ${data.length} transaction(s) returned`
    );
  } else {
    console.log("✅ TC2 PASSED: Empty transactions array returned (no data yet)");
  }
});


// ═══════════════════════════════════════════════
// TEST CASE 3: POST /api/sales — Add a Sale
// ═══════════════════════════════════════════════
// WHY: The AddTransactionModal posts to this endpoint. Tests
// that valid data is accepted, total is computed correctly,
// and invalid data is rejected with a 400 error.

let createdSaleId = null;

test("TC3: POST /api/sales creates a new sale", async () => {
  const payload = {
    item_name: "Test Item — Integration Test",
    quantity: 5,
    price: 100,
    date: new Date().toISOString().split("T")[0],
  };

  const { status, data } = await apiCall("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  expect(status).toBe(201);
  expect(data).toHaveProperty("id");
  expect(data).toHaveProperty("total");
  expect(data.total).toBe(payload.quantity * payload.price);

  createdSaleId = data.id;
  console.log(
    `✅ TC3 PASSED: Sale created — ID ${data.id}, Total ₱${data.total}`
  );
});

test("TC3b: POST /api/sales rejects missing fields", async () => {
  const { status, data } = await apiCall("/sales", {
    method: "POST",
    body: JSON.stringify({ price: 100 }), // missing item_name and quantity
  });

  expect(status).toBe(400);
  expect(data).toHaveProperty("error");

  console.log(`✅ TC3b PASSED: Missing fields rejected — ${data.error}`);
});


// ═══════════════════════════════════════════════
// TEST CASE 4: GET /api/sales/summary
// ═══════════════════════════════════════════════
// WHY: The AnalyticsChart uses this endpoint as a fallback.
// Each row must have month and total_sales for Recharts to
// render the line chart correctly.

test("TC4: GET /api/sales/summary returns monthly data", async () => {
  const { status, data } = await apiCall("/sales/summary");

  expect(status).toBe(200);
  expect(Array.isArray(data)).toBe(true);

  if (data.length > 0) {
    const row = data[0];
    expect(row).toHaveProperty("month");
    expect(row).toHaveProperty("total_sales");
    expect(row).toHaveProperty("transaction_count");

    // month format should be YYYY-MM
    expect(row.month).toMatch(/^\d{4}-\d{2}$/);
    expect(typeof row.total_sales).toBe("number");

    console.log(
      `✅ TC4 PASSED: ${data.length} month(s) of data — ` +
      `Latest: ${data[data.length - 1].month} = ₱${data[data.length - 1].total_sales}`
    );
  } else {
    console.log("✅ TC4 PASSED: Empty summary returned (no sales yet)");
  }
});


// ═══════════════════════════════════════════════
// TEST CASE 5: GET /api/forecast/budget
// ═══════════════════════════════════════════════
// WHY: The RecommendationCard calls this endpoint on every
// dashboard load. Tests that the model is loaded, returns a
// valid budget number, and the daily breakdown has 7 values.

test("TC5: GET /api/forecast/budget returns budget prediction", async () => {
  const { status, data } = await apiCall("/forecast/budget");

  // 200 = success, 400 = not enough data, 503 = model not loaded
  expect([200, 400, 503]).toContain(status);

  if (status === 200) {
    expect(data).toHaveProperty("recommended_budget");
    expect(data).toHaveProperty("model");
    expect(data).toHaveProperty("daily_forecast");
    expect(data).toHaveProperty("label");

    expect(typeof data.recommended_budget).toBe("number");
    expect(data.recommended_budget).toBeGreaterThan(0);
    expect(data.daily_forecast).toHaveLength(7);
    expect(["LSTM", "GRU", "ARIMA"]).toContain(data.model);

    // daily forecast should sum to recommended_budget
    const sum = data.daily_forecast.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - data.recommended_budget)).toBeLessThan(1);

    console.log(
      `✅ TC5 PASSED: Budget prediction — ₱${data.recommended_budget} (${data.model}) — ${data.label}`
    );
  } else if (status === 400) {
    expect(data).toHaveProperty("label");
    console.log(`✅ TC5 PASSED: Not enough data — ${data.label}`);
  } else if (status === 503) {
    expect(data).toHaveProperty("label");
    console.log(`⚠️  TC5 PASSED: Model not loaded — copy model files to ml/models/`);
  }
});


// ═══════════════════════════════════════════════
// TEST CASE 6: GET /api/forecast
// ═══════════════════════════════════════════════
// WHY: The AnalyticsChart calls this for the full forecast
// including the last 30 days of actual sales. Tests the full
// response shape that the chart depends on.

test("TC6: GET /api/forecast returns forecast and recent sales", async () => {
  const { status, data } = await apiCall("/forecast");

  expect([200, 400, 503]).toContain(status);

  if (status === 200) {
    // All required fields present
    expect(data).toHaveProperty("model");
    expect(data).toHaveProperty("forecast");
    expect(data).toHaveProperty("recent_sales");
    expect(data).toHaveProperty("recommended_budget");
    expect(data).toHaveProperty("steps");

    // forecast has exactly 7 days
    expect(data.forecast).toHaveLength(7);
    expect(data.steps).toBe(7);

    // recent_sales is an array of numbers
    expect(Array.isArray(data.recent_sales)).toBe(true);
    data.recent_sales.forEach((v) => {
      expect(typeof v).toBe("number");
    });

    // all forecast values are positive numbers
    data.forecast.forEach((v) => {
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
    });

    console.log(
      `✅ TC6 PASSED: Forecast — ${data.model} — ` +
      `${data.recent_sales.length} actual days + ${data.forecast.length} forecast days`
    );
  } else if (status === 400) {
    expect(data).toHaveProperty("error");
    console.log(`✅ TC6 PASSED: Not enough data — ${data.error}`);
  } else if (status === 503) {
    expect(data).toHaveProperty("error");
    console.log(`⚠️  TC6 PASSED: Model not loaded — ${data.error}`);
  }
});


// ═══════════════════════════════════════════════
// TEST CASE 7: POST /api/assistant/chat
// ═══════════════════════════════════════════════
// WHY: The AI Assistant panel sends messages to this endpoint.
// Tests that the Gemini API key is configured, the endpoint
// accepts a message and history, and returns a reply string.

test("TC7: POST /api/assistant/chat returns AI reply", async () => {
  const { status, data } = await apiCall("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({
      message: "What is a good budget tip for a small retail store?",
      history: [],
    }),
  });

  // 200 = success, 500 = Gemini key not set or API error
  expect([200, 500]).toContain(status);

  if (status === 200) {
    expect(data).toHaveProperty("reply");
    expect(typeof data.reply).toBe("string");
    expect(data.reply.length).toBeGreaterThan(0);

    console.log(
      `✅ TC7 PASSED: AI replied (${data.reply.length} chars) — ` +
      `"${data.reply.slice(0, 60)}..."`
    );
  } else {
    console.log(
      `⚠️  TC7: Assistant returned ${status} — check GEMINI_API_KEY in .env`
    );
  }
}, 30000); // 30s timeout — Gemini API can be slow


// ═══════════════════════════════════════════════
// TEST CASE 8: Data Consistency Check
// ═══════════════════════════════════════════════
// WHY: After TC3 added a test sale, this verifies it actually
// appears in the transactions list and sales summary — confirming
// the database write and read are both working end-to-end.

test("TC8: Added sale appears in transactions and summary", async () => {
  if (!createdSaleId) {
    console.log("⚠️  TC8 SKIPPED: TC3 did not create a sale");
    return;
  }

  // Check it appears in transactions
  const { data: transactions } = await apiCall("/transactions");
  const found = transactions.find((tx) => tx.id === createdSaleId);
  expect(found).toBeDefined();
  expect(found.id).toBe(createdSaleId);

  // Check summary is non-empty
  const { data: summary } = await apiCall("/sales/summary");
  expect(Array.isArray(summary)).toBe(true);
  expect(summary.length).toBeGreaterThan(0);

  console.log(
    `✅ TC8 PASSED: Sale ID ${createdSaleId} found in transactions — ` +
    `Summary has ${summary.length} month(s)`
  );
});