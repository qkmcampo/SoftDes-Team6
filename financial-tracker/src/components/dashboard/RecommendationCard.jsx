import { AlertTriangle, PiggyBank, Sparkles, TrendingUp } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function RecommendationCard({
  budgetData,
  balance = 0,
  topExpense,
  lowStockCount = 0,
  loading = false,
  onOpenFinancialSettings,
  onOpenTransactions,
  onOpenRestock,
}) {
  const budget = budgetData?.recommended_budget ?? null;
  const dailyForecast = Array.isArray(budgetData?.daily_forecast) ? budgetData.daily_forecast : [];
  const modelName = budgetData?.model || "Forecast";
  const savingsTarget = balance > 0 ? balance * 0.1 : 0;

  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Budget outlook</p>
          <h3 className="section-subtitle">Forecast-guided spending plan</h3>
          <p className="section-copy">
            Review the recommended budget, protect your reserve, and keep an eye on the most sensitive areas of the business.
          </p>
        </div>

        <div className="icon-chip h-12 w-12 rounded-[18px]">
          <Sparkles size={18} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84848A]">Recommended budget</p>
          <p className="mt-3 text-3xl font-semibold text-[#050725]">
            {loading ? (
              <span className="inline-block h-10 w-40 animate-pulse rounded-2xl bg-[#2C2F45]/10" />
            ) : budget != null ? (
              formatCurrency(budget)
            ) : (
              "Unavailable"
            )}
          </p>
          <p className="mt-2 text-sm text-[#6F6F76]">
            {budget != null
              ? `Powered by ${modelName} using the latest recorded sales pattern.`
              : "Forecast data is not available yet. Add more sales records to improve planning."}
          </p>

          {dailyForecast.length > 0 && (
            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {dailyForecast.slice(0, 7).map((value, index) => (
                <div key={`${value}-${index}`} className="rounded-2xl bg-[#ECDFC7]/70 px-3 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#84848A]">D{index + 1}</p>
                  <p className="mt-1 text-xs font-semibold text-[#050725]">
                    {formatCurrency(value).replace(".00", "")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={onOpenFinancialSettings}
            className="surface-card-soft interactive-surface w-full border border-[#2E6F4E]/12 bg-[#2E6F4E]/8 px-4 py-4 text-left hover:border-[#2E6F4E]/25"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2E6F4E]/18 text-[#2E6F4E]">
                <PiggyBank size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6F6F76]">Suggested reserve</p>
                <p className="mt-1 text-lg font-semibold text-[#050725]">{formatCurrency(savingsTarget)}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenTransactions}
            className="surface-card interactive-surface w-full px-4 py-4 text-left hover:border-[#F9B672]/25"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C2F45]/10 text-[#2C2F45]">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6F6F76]">Top expense watch</p>
                <p className="mt-1 text-sm font-semibold text-[#050725]">
                  {topExpense?.label || "No expense category recorded yet"}
                </p>
                {topExpense?.amount ? (
                  <p className="mt-1 text-xs text-[#84848A]">{formatCurrency(topExpense.amount)} spent so far</p>
                ) : null}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenRestock}
            className="surface-card-soft interactive-surface w-full border border-[#F9B672]/20 bg-[#F9B672]/12 px-4 py-4 text-left hover:border-[#F9B672]/35"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-[#C97D2F]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6F6F76]">Inventory attention</p>
                <p className="mt-1 text-sm font-semibold text-[#050725]">
                  {lowStockCount > 0
                    ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need restocking attention`
                    : "Inventory levels look stable today"}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

export default RecommendationCard;
