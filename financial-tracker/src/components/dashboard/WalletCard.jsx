import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function WalletCard({
  balance = 0,
  incomeTotal = 0,
  expenseTotal = 0,
  transactionCount = 0,
  referenceLabel = "Latest records",
  loading = false,
  onOpenTransactions,
}) {
  const balanceTone = balance >= 0 ? "text-white" : "text-[#FFD4D4]";

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#050725_0%,#1c223e_52%,#2C2F45_100%)] p-6 text-white shadow-[0_24px_60px_rgba(5,7,37,0.22)] sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,182,114,0.18),transparent_35%)]" />
      <div className="absolute -right-12 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F9B672]">
              Gerald Retail wallet
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-[2.6rem]">
              {loading ? (
                <span className="inline-block h-10 w-52 animate-pulse rounded-2xl bg-white/10" />
              ) : (
                <span className={balanceTone}>{formatCurrency(balance)}</span>
              )}
            </h2>
            <p className="mt-2 text-sm text-white/65">{referenceLabel}</p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Wallet size={24} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenTransactions}
            className="interactive-surface rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 text-left backdrop-blur-sm hover:border-[#F9B672]/35 hover:bg-white/16"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2E6F4E]/22 text-[#B9E5C7]">
                <ArrowDownLeft size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Cash In</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {loading ? <span className="inline-block h-6 w-28 animate-pulse rounded-xl bg-white/10" /> : formatCurrency(incomeTotal)}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenTransactions}
            className="interactive-surface rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 text-left backdrop-blur-sm hover:border-[#F9B672]/35 hover:bg-white/16"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B74747]/18 text-[#FFD3D3]">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Cash Out</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {loading ? <span className="inline-block h-6 w-28 animate-pulse rounded-xl bg-white/10" /> : formatCurrency(expenseTotal)}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-1 text-sm text-white/72">
          <span>{transactionCount} recorded transaction{transactionCount === 1 ? "" : "s"}</span>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#F9B672]">
            Live balance overview
          </span>
        </div>
      </div>
    </section>
  );
}

export default WalletCard;
