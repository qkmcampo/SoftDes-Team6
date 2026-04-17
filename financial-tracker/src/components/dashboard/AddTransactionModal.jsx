import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const expenseCategories = [
  "Bank Transfer",
  "Paypal",
  "Debit Card",
  "Cash",
  "Utilities",
  "Inventory",
  "Rent",
  "Supplies",
  "Other",
];

const incomeCategories = [
  "Sales",
  "Bank Transfer",
  "Cash",
  "Refund",
  "Other",
];

function AddTransactionModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    type: "expense",
    name: "",
    category: "Bank Transfer",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const closeTimerRef = useRef(null);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }, []);

  const isFieldHighlighted = (fieldName) => {
    if (!error?.field) return false;

    if (fieldName === "name") {
      return ["name", "to_name"].includes(error.field);
    }

    return error.field === fieldName;
  };

  const getInputClassName = (fieldName) =>
    `w-full bg-[#121212] border text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672] ${
      isFieldHighlighted(fieldName)
        ? "border-red-500/60 bg-red-500/5"
        : "border-[#333]"
    }`;

  const validateForm = () => {
    const trimmedName = form.name.trim();
    const amountText = String(form.amount ?? "").trim();

    if (!trimmedName) {
      return {
        title: "Missing description",
        message: "Please enter a transaction name or description before saving.",
        details:
          form.type === "income"
            ? "Add the income source so the record is easier to identify later."
            : "Add the supplier, recipient, or payment description so the record is easier to identify later.",
        field: "name",
      };
    }

    if (!amountText) {
      return {
        title: "Missing amount",
        message: "Please enter an amount before saving this transaction.",
        details: "Use numbers only, for example 500 or 1250.75.",
        field: "amount",
      };
    }

    const amountValue = Number(amountText);
    if (Number.isNaN(amountValue)) {
      return {
        title: "Invalid amount",
        message: "Please enter a valid numeric amount.",
        details: "Use numbers only, for example 500 or 1250.75.",
        field: "amount",
      };
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(null);
    setSuccess(null);
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type") {
        updated.category = value === "income" ? "Sales" : "Bank Transfer";
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const amountValue = Number(form.amount);
      const payload = {
        to_name: form.name.trim(),
        category: form.category,
        type: form.type,
        amount: form.type === "expense"
          ? -Math.abs(amountValue)
          : Math.abs(amountValue),
        date: form.date,
        note: form.note,
      };
      const response = await onSubmit(payload);

      const recordLabel = payload.to_name || payload.category || "this transaction";
      setSuccess({
        title: response?.message || "Transaction saved successfully.",
        message: `${form.type === "income" ? "Income" : "Expense"} entry for ${recordLabel} has been recorded.`,
        details: payload.date
          ? `Transaction date: ${payload.date}. This window will close automatically.`
          : "The transaction was saved without a date. This window will close automatically.",
      });

      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      const errorData = err.data || {};
      setError({
        title: errorData.title || "Unable to save transaction",
        message:
          errorData.error ||
          err.message ||
          "We could not save the transaction. Please review the form and try again.",
        details: errorData.details || null,
        field: errorData.field || null,
      });
      console.error("Submit error:", err);
    }

    setLoading(false);
  };

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-6">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#333] bg-[#1f1f1f] p-5 shadow-2xl sm:max-h-[90vh] sm:p-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* SUCCESS BANNER */}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">{success.title}</p>
                <p className="mt-1 text-emerald-100/90">{success.message}</p>
                {success.details && (
                  <p className="mt-2 text-xs text-emerald-100/70">{success.details}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm">
            <p className="font-semibold text-red-300">{error.title}</p>
            <p className="mt-1 text-red-400">{error.message}</p>
            {error.details && (
              <p className="mt-2 text-xs text-red-200/80">{error.details}</p>
            )}
          </div>
        )}

        {/* FORM */}
        <div className="flex flex-col gap-4">

          {/* TYPE TOGGLE */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: "type", value: "expense" } })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                  form.type === "expense"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-[#121212] text-gray-400 border border-[#333] hover:border-gray-500"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: "type", value: "income" } })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                  form.type === "income"
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-[#121212] text-gray-400 border border-[#333] hover:border-gray-500"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* NAME / DESCRIPTION */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              {form.type === "income" ? "Source / Description" : "Recipient / Description"}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={form.type === "income" ? "e.g. Store Sales" : "e.g. Supplier Payment"}
              aria-invalid={isFieldHighlighted("name")}
              className={getInputClassName("name")}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              aria-invalid={isFieldHighlighted("category")}
              className={getInputClassName("category")}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* AMOUNT */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Amount (PHP)</label>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="e.g. 500"
              aria-invalid={isFieldHighlighted("amount")}
              className={getInputClassName("amount")}
            />
          </div>

          {/* DATE */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className={getInputClassName("date")}
            />
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Note (optional)</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Add a note..."
              rows={2}
              className="w-full bg-[#121212] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672] resize-none"
            />
          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 border border-[#333] text-gray-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition"
          >
            {success ? "Close" : "Cancel"}
          </button>

          {/* Button is always clickable — no disabled condition
              so testers can submit with empty fields to verify
              the backend returns 400 with an error message     */}
          <button
            onClick={handleSubmit}
            disabled={loading || !!success}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
              form.type === "income"
                ? "bg-[#2E6F4E] hover:bg-[#245a3f] text-white"
                : "bg-[#2C2F45] hover:bg-[#050725] text-white"
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : success ? (
              <>Saved</>
            ) : (
              <>Add {form.type === "income" ? "Income" : "Expense"}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddTransactionModal;

