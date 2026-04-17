import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import HeaderBanner from "../components/dashboard/HeaderBanner";
import WalletCard from "../components/dashboard/WalletCard";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import AnalyticsChart from "../components/dashboard/AnalyticsChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AddTransactionModal from "../components/dashboard/AddTransactionModal";
import useSectionFocus from "../hooks/useSectionFocus";
import { forecastAPI, salesAPI, storageAPI, transactionsAPI } from "../services/api";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const fullDateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatCompactCurrency(value) {
  return compactCurrencyFormatter.format(Number(value) || 0);
}

function toNumber(value) {
  return Number(value) || 0;
}

function parseDateValue(value) {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function MetricPanel({
  icon: Icon,
  label,
  value,
  note,
  tone = "default",
  className = "",
  onClick,
}) {
  const toneMap = {
    default: {
      iconWrap: "bg-[#2C2F45]/10 text-[#2C2F45]",
      border: "border-[#2C2F45]/10",
      background: "bg-[#F4E9DA]",
    },
    success: {
      iconWrap: "bg-[#2E6F4E]/14 text-[#2E6F4E]",
      border: "border-[#2E6F4E]/12",
      background: "bg-[#F4E9DA]",
    },
    danger: {
      iconWrap: "bg-[#B74747]/12 text-[#B74747]",
      border: "border-[#B74747]/12",
      background: "bg-[#F4E9DA]",
    },
    accent: {
      iconWrap: "bg-[#F9B672]/18 text-[#C97D2F]",
      border: "border-[#F9B672]/20",
      background: "bg-[#F4E9DA]",
    },
  };

  const toneStyle = toneMap[tone] || toneMap.default;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`interactive-surface rounded-[28px] border ${toneStyle.border} ${toneStyle.background} p-5 text-left shadow-[0_18px_40px_rgba(5,7,37,0.08)] hover:border-[#F9B672]/25 ${className}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneStyle.iconWrap}`}>
        <Icon size={18} />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#84848A]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#050725]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#6F6F76]">{note}</p>
    </button>
  );
}

function InventoryPulseCard({
  inventoryCount,
  healthyRate,
  lowStockItems,
  criticalItems,
  onOpenRestock,
}) {
  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Inventory pulse</p>
          <h3 className="section-subtitle">Stock health at a glance</h3>
          <p className="section-copy">
            Focus first on critical stock and keep the rest of the shelf balanced before demand catches up.
          </p>
        </div>

        <div className="icon-chip h-12 w-12 rounded-[18px]">
          <PackageSearch size={18} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card-soft px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Inventory items</p>
          <p className="mt-2 text-2xl font-semibold text-[#050725]">{inventoryCount}</p>
        </div>
        <div className="surface-card-soft border border-[#2E6F4E]/12 bg-[#2E6F4E]/8 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Healthy stock</p>
          <p className="mt-2 text-2xl font-semibold text-[#050725]">{healthyRate}%</p>
        </div>
        <div className="surface-card-soft border border-[#F9B672]/20 bg-[#F9B672]/12 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Critical items</p>
          <p className="mt-2 text-2xl font-semibold text-[#050725]">{criticalItems.length}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card px-4 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#B74747]" />
            <p className="text-sm font-semibold text-[#050725]">Immediate restock</p>
          </div>
          <div className="mt-3 space-y-2">
            {criticalItems.length > 0 ? (
              criticalItems.slice(0, 4).map((item) => (
                <button
                  key={item.id || item.item_name}
                  type="button"
                  onClick={onOpenRestock}
                  className="interactive-surface w-full rounded-2xl bg-red-50 px-3 py-2 text-left text-sm text-[#050725] hover:bg-red-100"
                >
                  <span className="font-medium">{item.item_name}</span>
                  <span className="ml-2 text-[#84848A]">{item.current_stock} left</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-[#6F6F76]">No critical items at the moment.</p>
            )}
          </div>
        </div>

        <div className="surface-card px-4 py-4">
          <p className="text-sm font-semibold text-[#050725]">Watch list</p>
          <div className="mt-3 space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 4).map((item) => (
                <button
                  key={item.id || item.item_name}
                  type="button"
                  onClick={onOpenRestock}
                  className="interactive-surface w-full rounded-2xl bg-[#ECDFC7]/70 px-3 py-2 text-left text-sm text-[#050725] hover:bg-[#ECDFC7]"
                >
                  <span className="font-medium">{item.item_name}</span>
                  <span className="ml-2 text-[#84848A]">{item.status || "LOW"}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-[#6F6F76]">No low-stock items are currently flagged.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessPulseCard({
  salesTotal,
  salesCount,
  averageTicket,
  topExpense,
  referenceDate,
  onOpenAnalytics,
  onOpenTransactions,
}) {
  return (
    <section className="surface-panel surface-panel-pad">
      <p className="section-eyebrow">Business pulse</p>
      <h3 className="section-subtitle">Performance snapshot</h3>
      <p className="section-copy">
        Use the latest totals below to keep sales momentum aligned with your spending decisions.
      </p>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="surface-card interactive-surface flex w-full items-center justify-between px-4 py-4 text-left hover:border-[#F9B672]/25"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C2F45]/10 text-[#2C2F45]">
              <ShoppingBag size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Recorded sales</p>
              <p className="mt-1 text-sm text-[#6F6F76]">{salesCount} sale entries</p>
            </div>
          </div>
          <p className="text-lg font-semibold text-[#050725]">{formatCompactCurrency(salesTotal)}</p>
        </button>

        <button
          type="button"
          onClick={onOpenAnalytics}
          className="surface-card interactive-surface flex w-full items-center justify-between border border-[#2E6F4E]/12 px-4 py-4 text-left hover:border-[#2E6F4E]/25"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2E6F4E]/14 text-[#2E6F4E]">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Average sale ticket</p>
              <p className="mt-1 text-sm text-[#6F6F76]">Per recorded sale</p>
            </div>
          </div>
          <p className="text-lg font-semibold text-[#050725]">{formatCurrency(averageTicket)}</p>
        </button>

        <button
          type="button"
          onClick={onOpenTransactions}
          className="surface-card-soft interactive-surface w-full border border-[#F9B672]/20 bg-[#F9B672]/12 px-4 py-4 text-left hover:border-[#F9B672]/35"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/65 text-[#C97D2F]">
              <ReceiptText size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#84848A]">Top expense category</p>
              <p className="mt-1 text-sm font-semibold text-[#050725]">
                {topExpense?.label || "No expense category recorded yet"}
              </p>
              <p className="mt-1 text-xs text-[#6F6F76]">
                {topExpense?.amount ? `${formatCurrency(topExpense.amount)} spent so far` : "Add expense records to surface this insight."}
              </p>
            </div>
          </div>
        </button>
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[#84848A]">
        Latest activity date: {referenceDate ? shortDateFormatter.format(referenceDate) : "No records yet"}
      </p>
    </section>
  );
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [overview, setOverview] = useState({
    transactions: [],
    inventory: [],
    sales: [],
    budget: null,
  });

  const analyticsRef = useRef(null);
  const budgetRef = useRef(null);
  const inventoryRef = useRef(null);
  const transactionsRef = useRef(null);
  const businessPulseRef = useRef(null);

  const sectionRefs = useMemo(
    () => ({
      "analytics-section": analyticsRef,
      "budget-outlook": budgetRef,
      "inventory-pulse": inventoryRef,
      "recent-transactions": transactionsRef,
      "business-pulse": businessPulseRef,
    }),
    []
  );

  const focusedSection = useSectionFocus(sectionRefs);

  const navigateToSection = useCallback(
    (pathname, sectionId) => {
      navigate(`${pathname}#${sectionId}`, {
        state: {
          focusSection: sectionId,
          focusNonce: Date.now(),
        },
      });
    },
    [navigate]
  );

  const openRestockPanel = useCallback(() => {
    navigateToSection("/calendar", "restock-panel");
  }, [navigateToSection]);

  const openTransactionsSection = useCallback(() => {
    navigateToSection("/dashboard", "recent-transactions");
  }, [navigateToSection]);

  const openAnalyticsSection = useCallback(() => {
    navigateToSection("/dashboard", "analytics-section");
  }, [navigateToSection]);

  const openProfileSettings = useCallback(() => {
    navigateToSection("/profile", "financial-settings");
  }, [navigateToSection]);

  const fetchOverview = useCallback(async ({ skipCache = false } = {}) => {
    setOverviewLoading(true);
    setOverviewError("");

    const requestOptions = skipCache ? { skipCache: true } : {};

    const [transactionsResult, inventoryResult, salesResult, budgetResult] = await Promise.allSettled([
      transactionsAPI.getAll(1, 8, requestOptions),
      storageAPI.getAll(requestOptions),
      salesAPI.getAll(requestOptions),
      forecastAPI.getBudget(requestOptions),
    ]);

    const nextOverview = {
      transactions:
        transactionsResult.status === "fulfilled" && Array.isArray(transactionsResult.value)
          ? transactionsResult.value
          : [],
      inventory:
        inventoryResult.status === "fulfilled" && Array.isArray(inventoryResult.value)
          ? inventoryResult.value
          : [],
      sales:
        salesResult.status === "fulfilled" && Array.isArray(salesResult.value)
          ? salesResult.value
          : [],
      budget: budgetResult.status === "fulfilled" ? budgetResult.value : null,
    };

    setOverview(nextOverview);

    if (
      transactionsResult.status === "rejected" ||
      inventoryResult.status === "rejected" ||
      salesResult.status === "rejected"
    ) {
      setOverviewError("Some dashboard sections are showing limited data right now. The layout will keep working while the connection recovers.");
    }

    setOverviewLoading(false);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, refreshKey]);

  useEffect(() => {
    const refreshOverview = () => {
      if (document.visibilityState === "visible") {
        fetchOverview({ skipCache: true });
      }
    };

    const intervalId = window.setInterval(refreshOverview, 60000);
    document.addEventListener("visibilitychange", refreshOverview);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshOverview);
    };
  }, [fetchOverview]);

  const handleAddTransaction = async (data) => {
    try {
      const result = await transactionsAPI.add(data);
      setRefreshKey((previousKey) => previousKey + 1);
      return result;
    } catch (error) {
      console.error("Failed to add transaction:", error);
      throw error;
    }
  };

  const handleTransactionDeleted = () => {
    setRefreshKey((previousKey) => previousKey + 1);
  };

  const summary = useMemo(() => {
    const transactions = overview.transactions;
    const inventory = overview.inventory;
    const sales = overview.sales;

    const balance = transactions.reduce((total, transaction) => total + toNumber(transaction.amount), 0);
    const incomeEntries = transactions.filter((transaction) => toNumber(transaction.amount) >= 0).length;
    const expenseEntries = transactions.filter((transaction) => toNumber(transaction.amount) < 0).length;
    const incomeTotal = transactions.reduce((total, transaction) => {
      const amount = toNumber(transaction.amount);
      return amount >= 0 ? total + amount : total;
    }, 0);
    const expenseTotal = transactions.reduce((total, transaction) => {
      const amount = toNumber(transaction.amount);
      return amount < 0 ? total + Math.abs(amount) : total;
    }, 0);

    const expenseByCategory = transactions.reduce((categories, transaction) => {
      const amount = toNumber(transaction.amount);
      if (amount >= 0) return categories;

      const label = transaction.category || transaction.to_name || "Uncategorized";
      categories[label] = (categories[label] || 0) + Math.abs(amount);
      return categories;
    }, {});

    const topExpenseEntry = Object.entries(expenseByCategory).sort((left, right) => right[1] - left[1])[0];
    const topExpense = topExpenseEntry
      ? { label: topExpenseEntry[0], amount: topExpenseEntry[1] }
      : null;

    const lowStockItems = inventory.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "LOW" || status === "CRITICAL" || toNumber(item.current_stock) <= toNumber(item.min_level);
    });

    const criticalItems = inventory.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      if (status === "CRITICAL") return true;
      const minLevel = toNumber(item.min_level);
      const currentStock = toNumber(item.current_stock);
      return minLevel > 0 && currentStock < minLevel * 0.5;
    });

    const healthyRate = inventory.length
      ? Math.round(((inventory.length - lowStockItems.length) / inventory.length) * 100)
      : 0;

    const salesTotal = sales.reduce((total, sale) => total + toNumber(sale.total), 0);
    const salesCount = sales.length;
    const averageTicket = salesCount ? salesTotal / salesCount : 0;

    const recordDates = [...transactions.map((item) => parseDateValue(item.date)), ...sales.map((item) => parseDateValue(item.date))].filter(Boolean);
    const latestRecordDate = recordDates.length
      ? new Date(Math.max(...recordDates.map((item) => item.getTime())))
      : null;

    return {
      balance,
      incomeTotal,
      expenseTotal,
      incomeEntries,
      expenseEntries,
      transactionCount: transactions.length,
      lowStockItems,
      lowStockCount: lowStockItems.length,
      criticalItems,
      healthyRate,
      inventoryCount: inventory.length,
      salesTotal,
      salesCount,
      averageTicket,
      topExpense,
      latestRecordDate,
    };
  }, [overview]);

  const currentDate = new Date();
  const hour = currentDate.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = fullDateFormatter.format(currentDate);
  const userName = user?.fullName?.trim()?.split(/\s+/)[0] || "there";

  return (
    <div className="page-stack">
      <HeaderBanner
        greeting={greeting}
        userName={userName}
        dateLabel={dateLabel}
        transactionCount={summary.transactionCount}
        lowStockCount={summary.lowStockCount}
        criticalCount={summary.criticalItems.length}
        onAddTransaction={() => setShowModal(true)}
        onOpenTransactions={openTransactionsSection}
        onOpenRestock={openRestockPanel}
      />

      {overviewError ? (
        <div className="rounded-[24px] border border-[#F9B672]/25 bg-[#F9B672]/12 px-4 py-3 text-sm text-[#7A5A2C] shadow-[0_12px_28px_rgba(249,182,114,0.10)]">
          {overviewError}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <div className="md:col-span-2 xl:col-span-3">
          <WalletCard
            balance={summary.balance}
            incomeTotal={summary.incomeTotal}
            expenseTotal={summary.expenseTotal}
            transactionCount={summary.transactionCount}
            referenceLabel={
              summary.latestRecordDate
                ? `Updated from ${shortDateFormatter.format(summary.latestRecordDate)} records`
                : "Waiting for your first recorded transaction"
            }
            loading={overviewLoading}
            onOpenTransactions={openTransactionsSection}
          />
        </div>

        <MetricPanel
          icon={ArrowDownLeft}
          label="Recorded income"
          value={overviewLoading ? "Loading..." : formatCompactCurrency(summary.incomeTotal)}
          note={`${summary.incomeEntries} income entr${summary.incomeEntries === 1 ? "y" : "ies"} recorded so far.`}
          tone="success"
          className="xl:col-span-1"
          onClick={openTransactionsSection}
        />

        <MetricPanel
          icon={ArrowUpRight}
          label="Recorded expenses"
          value={overviewLoading ? "Loading..." : formatCompactCurrency(summary.expenseTotal)}
          note={summary.topExpense ? `${summary.topExpense.label} is the largest spend area.` : "Expense categories will appear here once recorded."}
          tone="danger"
          className="xl:col-span-1"
          onClick={openTransactionsSection}
        />

        <MetricPanel
          icon={ShoppingBag}
          label="Logged sales"
          value={overviewLoading ? "Loading..." : formatCompactCurrency(summary.salesTotal)}
          note={`${summary.salesCount} sale entr${summary.salesCount === 1 ? "y" : "ies"} with an average ticket of ${formatCurrency(summary.averageTicket)}.`}
          tone="accent"
          className="xl:col-span-1"
          onClick={openAnalyticsSection}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <div className="space-y-6">
          <div
            ref={analyticsRef}
            className={`section-anchor ${focusedSection === "analytics-section" ? "section-focus-highlight" : ""}`}
          >
            <AnalyticsChart />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div
              ref={budgetRef}
              className={`section-anchor ${focusedSection === "budget-outlook" ? "section-focus-highlight" : ""}`}
            >
              <RecommendationCard
                budgetData={overview.budget}
                balance={summary.balance}
                topExpense={summary.topExpense}
                lowStockCount={summary.lowStockCount}
                loading={overviewLoading}
                onOpenFinancialSettings={openProfileSettings}
                onOpenTransactions={openTransactionsSection}
                onOpenRestock={openRestockPanel}
              />
            </div>

            <div
              ref={inventoryRef}
              className={`section-anchor ${focusedSection === "inventory-pulse" ? "section-focus-highlight" : ""}`}
            >
              <InventoryPulseCard
                inventoryCount={summary.inventoryCount}
                healthyRate={summary.healthyRate}
                lowStockItems={summary.lowStockItems}
                criticalItems={summary.criticalItems}
                onOpenRestock={openRestockPanel}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            ref={transactionsRef}
            className={`section-anchor ${focusedSection === "recent-transactions" ? "section-focus-highlight" : ""}`}
          >
            <RecentTransactions
              refreshKey={refreshKey}
              maxItems={6}
              onTransactionDeleted={handleTransactionDeleted}
            />
          </div>

          <div
            ref={businessPulseRef}
            className={`section-anchor ${focusedSection === "business-pulse" ? "section-focus-highlight" : ""}`}
          >
            <BusinessPulseCard
              salesTotal={summary.salesTotal}
              salesCount={summary.salesCount}
              averageTicket={summary.averageTicket}
              topExpense={summary.topExpense}
              referenceDate={summary.latestRecordDate}
              onOpenAnalytics={openAnalyticsSection}
              onOpenTransactions={openTransactionsSection}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} onSubmit={handleAddTransaction} />
      )}
    </div>
  );
}
