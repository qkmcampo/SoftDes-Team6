import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

const hours = Array.from({ length: 14 }, (_, index) => index + 7);
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

const weekEvents = [
  { day: 1, hour: 9, label: "Monthly Bills Payment", color: "bg-[#2C2F45] text-white" },
  { day: 1, hour: 14, label: "Inventory Check", color: "bg-[#F9B672] text-[#050725]" },
  { day: 2, hour: 10, label: "Supplier Meeting", color: "bg-[#2C2F45] text-white" },
  { day: 3, hour: 11, label: "Restock Delivery", color: "bg-[#2E6F4E] text-white" },
  { day: 4, hour: 9, label: "Sales Review", color: "bg-[#F9B672] text-[#050725]" },
  { day: 4, hour: 15, label: "Price Adjustment", color: "bg-[#2C2F45] text-white" },
  { day: 5, hour: 13, label: "Supplier Payment", color: "bg-[#2E6F4E] text-white" },
];

function getWeekStart(date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function WeekView({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(getWeekStart(selectedDate || today));

  useEffect(() => {
    if (selectedDate) {
      setWeekStart(getWeekStart(selectedDate));
    }
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      return day;
    });
  }, [weekStart]);

  const weekLabel = monthFormatter.format(weekDays[0]);

  const getEventsForSlot = (dayIndex, hour) =>
    weekEvents.filter((event) => event.day === dayIndex && event.hour === hour);

  const isSameDate = (left, right) => left?.toDateString() === right?.toDateString();

  return (
    <section className="surface-panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#2C2F45]/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="section-eyebrow">Week view</p>
          <h3 className="section-subtitle">{weekLabel}</h3>
          <p className="section-copy">
            Focus on daily timing, supplier schedules, and operational reminders across the current week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((previousValue) => new Date(previousValue.getFullYear(), previousValue.getMonth(), previousValue.getDate() - 7))}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((previousValue) => new Date(previousValue.getFullYear(), previousValue.getMonth(), previousValue.getDate() + 7))}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(today)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2C2F45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#050725]"
          >
            <CalendarClock size={15} />
            This Week
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-8 border-b border-[#2C2F45]/8 bg-white/35">
            <div className="px-3 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#84848A]">Time</div>
            {weekDays.map((date) => (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`px-3 py-4 text-center transition ${
                  isSameDate(selectedDate, date) ? "bg-[#F9B672]/16" : "hover:bg-white/45"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#84848A]">
                  {dayNames[date.getDay()]}
                </p>
                <p
                  className={`mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isSameDate(today, date)
                      ? "bg-[#050725] text-white"
                      : isSameDate(selectedDate, date)
                      ? "bg-[#F9B672] text-[#050725]"
                      : "text-[#050725]"
                  }`}
                >
                  {date.getDate()}
                </p>
              </button>
            ))}
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-[#2C2F45]/8">
                <div className="flex items-start gap-2 px-3 py-4 text-[11px] font-medium text-[#84848A]">
                  <Clock3 size={12} className="mt-0.5 shrink-0" />
                  {formatHourLabel(hour)}
                </div>

                {weekDays.map((date, dayIndex) => {
                  const events = getEventsForSlot(dayIndex, hour);
                  const isCurrentDay = isSameDate(today, date);
                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      className={`min-h-[62px] border-l border-[#2C2F45]/8 px-2 py-2 transition ${
                        isCurrentDay ? "bg-[#F9B672]/6" : "bg-white/35"
                      }`}
                    >
                      <div className="space-y-2">
                        {events.map((event, index) => (
                          <div
                            key={`${event.label}-${index}`}
                            className={`rounded-2xl px-3 py-2 text-[11px] font-semibold shadow-[0_10px_24px_rgba(5,7,37,0.08)] ${event.color}`}
                          >
                            {event.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeekView;
