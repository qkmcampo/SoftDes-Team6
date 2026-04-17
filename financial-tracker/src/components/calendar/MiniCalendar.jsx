import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

function MiniCalendar({ selectedDate, onSelectDate }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: firstDay + totalDays }, (_, index) => {
      if (index < firstDay) {
        return null;
      }
      const day = index - firstDay + 1;
      return new Date(year, month, day);
    });
  }, [month, year]);

  const isSameDate = (left, right) => left?.toDateString() === right?.toDateString();
  const today = new Date();

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Mini calendar</p>
          <h3 className="mt-2 text-lg font-semibold text-[#050725]">{monthFormatter.format(viewMonth)}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-y-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#84848A]">
        {dayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-2">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const selected = isSameDate(selectedDate, date);
          const todaySelected = isSameDate(today, date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                selected
                  ? "bg-[#2C2F45] text-white"
                  : todaySelected
                  ? "bg-[#F9B672] text-[#050725]"
                  : "text-[#050725] hover:bg-[#ECDFC7]"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MiniCalendar;
