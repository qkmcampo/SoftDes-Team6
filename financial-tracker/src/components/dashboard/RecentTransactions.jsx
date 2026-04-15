import { useState, useMemo, useEffect } from "react"
import {
  CreditCard,
  Landmark,
  Wallet,
  Trash2,
  ArrowDownLeft,
} from "lucide-react"
import { transactionsAPI } from "../../services/api"

const iconMap = {
  "Bank Transfer": Landmark,
  "Paypal": Wallet,
  "Debit Card": CreditCard,
}

function RecentTransactions({ onViewAll }) {

  const [data, setData] = useState([])

  const ITEMS_PER_PAGE = 8
  const [currentPage, setCurrentPage] = useState(1)

  // ✅ FETCH DATA (IMPORTANT FIX)
  const fetchTransactions = async () => {
    try {
      const res = await transactionsAPI.getAll()
      setData(res || [])
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    }
  }

  // ✅ Load on mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  // ✅ Auto refresh every 2 seconds (REAL-TIME EFFECT)
  useEffect(() => {
    const interval = setInterval(fetchTransactions, 2000)
    return () => clearInterval(interval)
  }, [])

  const totalPages = Math.ceil((data?.length || 0) / ITEMS_PER_PAGE)

  const paginatedData = useMemo(() => {
    if (!data) return []
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return data.slice(start, start + ITEMS_PER_PAGE)
  }, [data, currentPage])

  const handleDelete = async (id) => {
    await transactionsAPI.delete(id)
    fetchTransactions() // ✅ REFRESH AFTER DELETE
  }

  return (
    <div className="bg-surface rounded-2xl p-6 shadow-card h-full flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-primary">
          Recent Transactions
        </h3>

        <button
          onClick={onViewAll}
          className="text-xs font-medium text-accent hover:text-primary transition-colors"
        >
          View All
        </button>
      </div>

      {/* LIST */}
      <ul className="space-y-1 flex-1 overflow-y-auto">

        {data.length === 0 && (
          <li className="text-sm text-neutral text-center py-8">
            No transactions yet
          </li>
        )}

        {paginatedData.map((t) => {
          const Icon = iconMap[t.category] ?? CreditCard
          const isIncome = t.type === "income" || t.amount > 0

          return (
            <li
              key={t.id}
              className="flex justify-between items-center py-3 border-b border-neutral/10 last:border-0 hover:bg-background/50 rounded-xl px-2 transition-colors"
            >

              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isIncome ? "bg-[#2E6F4E]/10" : "bg-secondary"}`}>
                  {isIncome
                    ? <ArrowDownLeft size={18} className="text-[#2E6F4E]" />
                    : <Icon size={18} className="text-white" />
                  }
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    {t.to_name || t.category || t.type}
                  </p>

                  <p className="text-xs text-neutral mt-0.5">
                    {t.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold ${isIncome ? "text-[#2E6F4E]" : "text-red-500"}`}>
                    {isIncome ? "+" : "-"}₱{Math.abs(t.amount).toFixed(2)}
                  </p>

                  <p className="text-[11px] text-neutral mt-0.5">
                    {t.date}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-neutral/40 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </li>
          )
        })}

      </ul>

      {/* PAGINATION */}
      {data.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-4 text-xs">

          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-secondary disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-neutral">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-secondary disabled:opacity-50"
          >
            Next
          </button>

        </div>
      )}

    </div>
  )
}

export default RecentTransactions