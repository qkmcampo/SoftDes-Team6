import { CalendarDays, Plus } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";

function HeaderBanner({
  greeting,
  userName,
  dateLabel,
  transactionCount,
  lowStockCount,
  criticalCount,
  onAddTransaction,
  onOpenTransactions,
  onOpenRestock,
}) {
  const highlightItems = [
    {
      label: "Recorded transactions",
      value: transactionCount,
      onClick: onOpenTransactions,
    },
    {
      label: "Stock alerts",
      value: lowStockCount,
      onClick: onOpenRestock,
    },
    {
      label: "Critical items",
      value: criticalCount,
      onClick: onOpenRestock,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#2C2F45] px-6 py-6 text-white shadow-[0_24px_60px_rgba(5,7,37,0.18)] sm:px-7 sm:py-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,182,114,0.22),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_58%)]" />
      <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#F9B672] backdrop-blur-sm">
            <BrandLogo className="h-5 w-5" primary="#F4E9DA" accent="#F9B672" title="Gerald Retail logo" />
            Gerald Retail
          </div>

          <h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-[2rem]">
            {greeting}, {userName}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Track cash flow, restocking priorities, and forecasts in one workspace.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/78">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <CalendarDays size={15} className="text-[#F9B672]" />
              {dateLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[290px] xl:max-w-[320px]">
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-[#F9B672] px-5 py-3 text-sm font-semibold text-[#050725] shadow-[0_18px_35px_rgba(249,182,114,0.22)] transition hover:bg-[#efac68]"
          >
            <Plus size={18} />
            Add Transaction
          </button>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlightItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="interactive-surface rounded-[20px] border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm hover:border-[#F9B672]/35 hover:bg-white/16"
              >
                <p className="text-base font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeaderBanner;
