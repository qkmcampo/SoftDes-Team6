import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  CreditCard,
  Landmark,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { transactionsAPI } from "../../services/api";

const iconMap = {
  "Bank Transfer": Landmark,
  Paypal: Wallet,
  "Debit Card": CreditCard,
  Cash: Wallet,
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value || "No date";
  }
  return dateFormatter.format(parsedDate);
}

function RecentTransactions({ refreshKey = 0, maxItems = 7, onTransactionDeleted }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTransactions = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const response = await transactionsAPI.getAll(1, 20, options);
      setTransactions(Array.isArray(response) ? response : []);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions({ skipCache: true });
  }, [fetchTransactions, refreshKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchTransactions({ skipCache: true });
      }
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const amount = Number(transaction.amount) || 0;
      const isIncome = transaction.type === "income" || amount >= 0;
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "income" && isIncome) ||
        (activeFilter === "expense" && !isIncome);

      const haystack = [
        transaction.to_name,
        transaction.category,
        transaction.type,
        transaction.note,
        transaction.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, transactions]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, maxItems),
    [filteredTransactions, maxItems]
  );

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (amount >= 0) {
          summary.income += amount;
        } else {
          summary.expense += Math.abs(amount);
        }
        return summary;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await transactionsAPI.delete(id);
      await fetchTransactions({ skipCache: true });
      onTransactionDeleted?.();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expense" },
  ];

  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">Recent transactions</p>
          <h3 className="section-subtitle">Latest financial activity</h3>
          <p className="section-copy">
            Review the most recent entries, filter the list instantly, and remove any transaction that was added by mistake.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2C2F45]/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6F6F76]">
              Live at {lastUpdated}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => fetchTransactions({ skipCache: true })}
            className="inline-flex items-center gap-2 rounded-full border border-[#2C2F45]/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2C2F45] transition hover:bg-white"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="surface-card flex items-center gap-3 px-4 py-3">
          <Search size={15} className="text-[#84848A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search transactions, notes, or categories"
            className="w-full bg-transparent text-sm text-[#050725] outline-none placeholder:text-[#84848A]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                activeFilter === filter.key
                  ? "bg-[#2C2F45] text-white shadow-[0_14px_28px_rgba(5,7,37,0.14)]"
                  : "border border-[#2C2F45]/10 bg-white/70 text-[#6F6F76] hover:bg-white hover:text-[#050725]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="surface-card-soft border border-[#2E6F4E]/12 bg-[#2E6F4E]/8 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#6F6F76]">Cash in</p>
          <p className="mt-2 text-xl font-semibold text-[#050725]">{formatCurrency(totals.income)}</p>
        </div>
        <div className="surface-card-soft border border-[#B74747]/12 bg-[#B74747]/6 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#6F6F76]">Cash out</p>
          <p className="mt-2 text-xl font-semibold text-[#050725]">{formatCurrency(totals.expense)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: Math.min(maxItems, 5) }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[24px] border border-[#2C2F45]/8 bg-white/70 px-4 py-4">
              <div className="h-4 w-28 rounded bg-[#2C2F45]/10" />
              <div className="mt-3 h-3 w-40 rounded bg-[#2C2F45]/8" />
            </div>
          ))
        ) : visibleTransactions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2C2F45]/12 bg-white/45 px-5 py-12 text-center">
            <p className="text-sm font-medium text-[#050725]">No transactions match the current filter</p>
            <p className="mt-2 text-sm text-[#84848A]">Try another search term or switch back to all entries.</p>
          </div>
        ) : (
          visibleTransactions.map((transaction) => {
            const amount = Number(transaction.amount) || 0;
            const isIncome = transaction.type === "income" || amount >= 0;
            const Icon = isIncome ? ArrowDownLeft : iconMap[transaction.category] ?? CreditCard;

            return (
              <div
                key={transaction.id}
                className="flex flex-col gap-4 rounded-[24px] border border-[#2C2F45]/8 bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isIncome ? "bg-[#2E6F4E]/14 text-[#2E6F4E]" : "bg-[#2C2F45] text-white"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#050725]">
                      {transaction.to_name || transaction.category || transaction.type || "Transaction"}
                    </p>
                    <p className="mt-1 text-xs text-[#84848A]">
                      {(transaction.type || "Transaction").toUpperCase()} • {formatDate(transaction.date)}
                    </p>
                    {transaction.note ? (
                      <p className="mt-1 truncate text-xs text-[#6F6F76]">{transaction.note}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className={`text-sm font-semibold ${isIncome ? "text-[#2E6F4E]" : "text-[#B74747]"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(Math.abs(amount))}
                    </p>
                    <p className="mt-1 text-[11px] text-[#84848A]">{transaction.category || "General"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deletingId === transaction.id}
                    className="rounded-xl p-2 text-[#84848A] transition hover:bg-red-50 hover:text-[#B74747] disabled:opacity-50"
                  >
                    {deletingId === transaction.id ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#84848A] border-t-transparent" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default RecentTransactions;
