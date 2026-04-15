import { X } from "lucide-react";
import { useState } from "react";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(null);
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
    setLoading(true);

    try {
      await onSubmit({
        to_name: form.name.trim(),
        category: form.category,
        type: form.type,
        amount: form.type === "expense"
          ? -Math.abs(parseFloat(form.amount))
          : Math.abs(parseFloat(form.amount)),
        date: form.date,
        note: form.note,
      });
    } catch (err) {
      // Show the backend error message inside the modal
      // so the tester can see the 400 response
      setError(err.message || "Server returned an error");
      console.error("Submit error:", err);
    }

    setLoading(false);
  };

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* ERROR BANNER — shows backend 400 error message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* FORM */}
        <div className="flex flex-col gap-4">

          {/* TYPE TOGGLE */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Type</label>
            <div className="flex gap-2">
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
              className="w-full bg-[#121212] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672]"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-[#121212] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* AMOUNT */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Amount (₱)</label>
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="e.g. 500"
              className="w-full bg-[#121212] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672]"
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
              className="w-full bg-[#121212] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F9B672]"
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
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-[#333] text-gray-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition"
          >
            Cancel
          </button>

          {/* Button is always clickable — no disabled condition
              so testers can submit with empty fields to verify
              the backend returns 400 with an error message     */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
              form.type === "income"
                ? "bg-[#2E6F4E] hover:bg-[#245a3f] text-white"
                : "bg-[#2C2F45] hover:bg-[#050725] text-white"
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
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