import {
  AlertTriangle,
  ClipboardList,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

const fullDateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toStartOfDay(value = new Date()) {
  const nextDate = new Date(value);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(baseDate, daysToAdd) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
}

function toIsoDate(value) {
  return toStartOfDay(value).toISOString().split("T")[0];
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : toStartOfDay(parsedDate);
}

function groupByDate(records = []) {
  return records.reduce((groups, record) => {
    const parsedDate = parseDate(record?.date);
    if (!parsedDate) {
      return groups;
    }

    const dateKey = toIsoDate(parsedDate);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(record);
    return groups;
  }, {});
}

function buildInventoryEvent({ dayOffset, criticalItems, lowItems }) {
  if (criticalItems.length > 0 && dayOffset <= 2) {
    const leadItem = criticalItems[0];
    const extraCount = criticalItems.length - 1;

    return {
      time: dayOffset === 0 ? "8:30 AM" : "9:00 AM",
      label: `Urgent restock: ${leadItem.item_name}${extraCount > 0 ? ` +${extraCount} more` : ""}`,
      description: "Critical stock needs immediate action in the restock panel.",
      icon: AlertTriangle,
      color: "bg-[#F9B672]/18 text-[#050725]",
      link: "/calendar#restock-panel",
    };
  }

  if (lowItems.length > 0 && dayOffset === 0) {
    const leadItem = lowItems[0];
    const extraCount = lowItems.length - 1;

    return {
      time: "10:30 AM",
      label: `Low-stock follow-up: ${leadItem.item_name}${extraCount > 0 ? ` +${extraCount} more` : ""}`,
      description: "Review stock movement before the next supplier cycle.",
      icon: ShoppingCart,
      color: "bg-white text-[#050725] border border-[#2C2F45]/10",
      link: "/calendar#restock-panel",
    };
  }

  return null;
}

function buildSalesEvent(daySales = []) {
  if (!daySales.length) {
    return null;
  }

  const totalSales = daySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
  const leadSale = [...daySales].sort((left, right) => (Number(right.total) || 0) - (Number(left.total) || 0))[0];

  return {
    time: "1:00 PM",
    label: `Sales recorded ${currencyFormatter.format(totalSales)}`,
    description: `${daySales.length} sale entr${daySales.length === 1 ? "y" : "ies"}${leadSale?.item_name ? ` led by ${leadSale.item_name}` : ""}.`,
    icon: TrendingUp,
    color: "bg-[#2E6F4E] text-white",
    link: "/dashboard#business-pulse",
  };
}

function buildTransactionEvent(dayTransactions = []) {
  if (!dayTransactions.length) {
    return null;
  }

  const totals = dayTransactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (amount >= 0) {
        summary.income += amount;
        summary.incomeCount += 1;
      } else {
        summary.expense += Math.abs(amount);
        summary.expenseCount += 1;
      }
      return summary;
    },
    { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 }
  );

  if (totals.incomeCount && totals.expenseCount) {
    return {
      time: "3:30 PM",
      label: `Cash movement updated ${currencyFormatter.format(totals.income - totals.expense)}`,
      description: `${dayTransactions.length} transaction entr${dayTransactions.length === 1 ? "y" : "ies"} with both income and expense activity.`,
      icon: Wallet,
      color: "bg-[#2C2F45] text-white",
      link: "/dashboard#recent-transactions",
    };
  }

  if (totals.incomeCount) {
    return {
      time: "3:30 PM",
      label: `Income recorded ${currencyFormatter.format(totals.income)}`,
      description: `${totals.incomeCount} income entr${totals.incomeCount === 1 ? "y" : "ies"} added to the ledger.`,
      icon: Wallet,
      color: "bg-[#2E6F4E] text-white",
      link: "/dashboard#recent-transactions",
    };
  }

  return {
    time: "3:30 PM",
    label: `Expenses logged ${currencyFormatter.format(totals.expense)}`,
    description: `${totals.expenseCount} expense entr${totals.expenseCount === 1 ? "y" : "ies"} need review against the current budget.`,
    icon: Receipt,
    color: "bg-[#2C2F45] text-white",
    link: "/dashboard#recent-transactions",
  };
}

function buildRoutineEvent(date, dayOffset) {
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 1) {
    return {
      time: "9:30 AM",
      label: "Weekly budget checkpoint",
      description: "Use the assistant to review reserve goals and the week's expense direction.",
      icon: ClipboardList,
      color: "bg-[#2C2F45] text-white",
      link: "/assistant#conversation-panel",
    };
  }

  if (dayOfWeek === 5) {
    return {
      time: "4:30 PM",
      label: "Weekend stock prep",
      description: "Compare fast sellers with low-stock items before the busy weekend window.",
      icon: ShoppingCart,
      color: "bg-white text-[#050725] border border-[#2C2F45]/10",
      link: "/calendar#restock-panel",
    };
  }

  if (dayOffset === 0) {
    return {
      time: "8:00 AM",
      label: "Daily operations review",
      description: "Check today's balance, recent transactions, and inventory watch list before opening.",
      icon: ClipboardList,
      color: "bg-[#2C2F45] text-white",
      link: "/dashboard#analytics-section",
    };
  }

  return {
    time: "5:00 PM",
    label: "Assistant briefing",
    description: "Review spending, cash flow, and planning notes for the next business day.",
    icon: ClipboardList,
    color: "bg-white text-[#050725] border border-[#2C2F45]/10",
    link: "/assistant#conversation-panel",
  };
}

export function buildAgendaDays({
  selectedDate = new Date(),
  inventoryItems = [],
  transactions = [],
  sales = [],
  days = 7,
}) {
  const anchorDate = toStartOfDay(selectedDate);
  const today = toStartOfDay(new Date());
  const todayKey = toIsoDate(today);
  const selectedKey = toIsoDate(anchorDate);

  const transactionsByDate = groupByDate(transactions);
  const salesByDate = groupByDate(sales);

  const criticalItems = inventoryItems.filter((item) => String(item.status || "").toUpperCase() === "CRITICAL");
  const lowItems = inventoryItems.filter((item) => {
    const status = String(item.status || "").toUpperCase();
    return status === "LOW" || status === "CRITICAL";
  });

  return Array.from({ length: days }, (_, index) => {
    const currentDate = addDays(anchorDate, index);
    const dateKey = toIsoDate(currentDate);
    const dailyEvents = [];

    const inventoryEvent = buildInventoryEvent({
      dayOffset: index,
      criticalItems,
      lowItems,
    });
    const salesEvent = buildSalesEvent(salesByDate[dateKey] || []);
    const transactionEvent = buildTransactionEvent(transactionsByDate[dateKey] || []);
    const routineEvent = buildRoutineEvent(currentDate, index);

    if (inventoryEvent) {
      dailyEvents.push(inventoryEvent);
    }

    if (salesEvent) {
      dailyEvents.push(salesEvent);
    }

    if (transactionEvent) {
      dailyEvents.push(transactionEvent);
    }

    if (dailyEvents.length < 2 || index === 0) {
      dailyEvents.push(routineEvent);
    }

    return {
      date: dateKey,
      dateLabel: fullDateFormatter.format(currentDate),
      shortLabel: compactDateFormatter.format(currentDate),
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
      events: dailyEvents.slice(0, 3),
    };
  });
}
