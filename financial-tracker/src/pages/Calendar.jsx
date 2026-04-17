import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarRange,
  LayoutGrid,
  ListChecks,
  Rows3,
} from "lucide-react";

import AgendaPanel from "../components/calendar/AgendaPanel";
import AgendaView from "../components/calendar/AgendaView";
import CalendarGrid from "../components/calendar/CalendarGrid";
import MiniCalendar from "../components/calendar/MiniCalendar";
import RestockPanel from "../components/calendar/RestockPanel";
import WeekView from "../components/calendar/WeekView";
import useSectionFocus from "../hooks/useSectionFocus";
import useApi from "../hooks/useApi";
import { salesAPI, storageAPI, transactionsAPI } from "../services/api";
import { buildAgendaDays } from "../utils/calendarAgenda";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState("month");
  const {
    data: inventoryData,
    loading: inventoryLoading,
    refetch: refetchInventory,
  } = useApi(() => storageAPI.getAll({ skipCache: true }), []);
  const {
    data: transactionsData,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useApi(() => transactionsAPI.getAll(1, 50, { skipCache: true }), []);
  const {
    data: salesData,
    loading: salesLoading,
    refetch: refetchSales,
  } = useApi(() => salesAPI.getAll({ skipCache: true }), []);
  const miniCalendarRef = useRef(null);
  const agendaRef = useRef(null);
  const weekRef = useRef(null);
  const restockRef = useRef(null);

  const views = [
    { key: "week", label: "Week", icon: Rows3 },
    { key: "month", label: "Month", icon: LayoutGrid },
    { key: "agenda", label: "Agenda", icon: ListChecks },
  ];

  const inventoryItems = Array.isArray(inventoryData) ? inventoryData : [];
  const transactionItems = Array.isArray(transactionsData) ? transactionsData : [];
  const salesItems = Array.isArray(salesData) ? salesData : [];
  const calendarLoading = inventoryLoading || transactionsLoading || salesLoading;
  const attentionCount = useMemo(() => {
    return inventoryItems.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "LOW" || status === "CRITICAL";
    }).length;
  }, [inventoryItems]);

  const agendaPreview = useMemo(
    () =>
      buildAgendaDays({
        selectedDate,
        inventoryItems,
        transactions: transactionItems,
        sales: salesItems,
        days: 6,
      }),
    [inventoryItems, salesItems, selectedDate, transactionItems]
  );

  const agendaTimeline = useMemo(
    () =>
      buildAgendaDays({
        selectedDate,
        inventoryItems,
        transactions: transactionItems,
        sales: salesItems,
        days: 12,
      }),
    [inventoryItems, salesItems, selectedDate, transactionItems]
  );

  const refreshCalendarFeeds = useCallback(() => {
    return Promise.allSettled([refetchInventory(), refetchTransactions(), refetchSales()]);
  }, [refetchInventory, refetchSales, refetchTransactions]);

  const sectionRefs = useMemo(
    () => ({
      "mini-calendar": miniCalendarRef,
      "agenda-panel": agendaRef,
      "week-view": weekRef,
      "restock-panel": restockRef,
    }),
    []
  );

  const focusedSection = useSectionFocus(sectionRefs, {
    onBeforeFocus: (sectionId) => {
      if (sectionId === "agenda-panel") {
        setActiveView("month");
      }

      if (sectionId === "week-view") {
        setActiveView("week");
      }
    },
  });

  useEffect(() => {
    const refreshVisibleData = () => {
      if (document.visibilityState === "visible") {
        refreshCalendarFeeds();
      }
    };

    const intervalId = window.setInterval(refreshVisibleData, 60000);
    document.addEventListener("visibilitychange", refreshVisibleData);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshVisibleData);
    };
  }, [refreshCalendarFeeds]);

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel-pad">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9B672]/14 px-3 py-1.5 section-eyebrow">
              <CalendarRange size={14} />
              Calendar
            </div>
            <h1 className="section-title">Schedules and planning</h1>
            <p className="section-copy">
              Review bills, deliveries, restocks, and agenda items in one workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="info-pill">
                {dateFormatter.format(selectedDate)}
              </span>
              {attentionCount > 0 ? (
                <button
                  type="button"
                  onClick={() => restockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="interactive-surface inline-flex items-center gap-2 rounded-full border border-[#F9B672]/25 bg-[#F9B672]/12 px-4 py-2 font-medium text-[#7A5A2C] hover:border-[#F9B672]/40"
                >
                  <AlertTriangle size={14} className="text-[#C97D2F]" />
                  {attentionCount} stock alert{attentionCount === 1 ? "" : "s"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="surface-card-soft p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-eyebrow">View</p>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#84848A]">
                {views.find((view) => view.key === activeView)?.label || "Month"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-[22px] border border-[#2C2F45]/10 bg-white/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {views.map((view) => {
                const Icon = view.icon;
                const isActive = activeView === view.key;

                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => setActiveView(view.key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#2C2F45] text-white shadow-[0_12px_24px_rgba(5,7,37,0.16)]"
                        : "text-[#6F6F76] hover:text-[#050725]"
                    }`}
                  >
                    <Icon size={15} />
                    {view.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.52fr)_360px]">
        <div className="space-y-6">
          {activeView === "month" && (
            <>
              <CalendarGrid selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <div
                ref={agendaRef}
                className={`section-anchor ${focusedSection === "agenda-panel" ? "section-focus-highlight" : ""}`}
              >
                <AgendaPanel
                  agendaDays={agendaPreview}
                  loading={calendarLoading}
                  selectedDate={selectedDate}
                />
              </div>
            </>
          )}

          {activeView === "week" && (
            <div
              ref={weekRef}
              className={`section-anchor ${focusedSection === "week-view" ? "section-focus-highlight" : ""}`}
            >
              <WeekView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
          )}

          {activeView === "agenda" && (
            <AgendaView
              agendaDays={agendaTimeline}
              loading={calendarLoading}
              selectedDate={selectedDate}
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:pr-2">
          <div
            ref={miniCalendarRef}
            className={`section-anchor ${focusedSection === "mini-calendar" ? "section-focus-highlight" : ""}`}
          >
            <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
          <div
            ref={restockRef}
            className={`section-anchor ${focusedSection === "restock-panel" ? "section-focus-highlight" : ""}`}
          >
            <RestockPanel items={inventoryItems} loading={inventoryLoading} onRefresh={refreshCalendarFeeds} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Calendar;
