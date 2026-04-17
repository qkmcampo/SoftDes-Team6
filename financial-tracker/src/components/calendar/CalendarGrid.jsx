import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

function CalendarGrid({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const totalCells = 42;

    return Array.from({ length: totalCells }, (_, index) => {
      if (index < firstDay) {
        const day = daysInPreviousMonth - firstDay + index + 1;
        return {
          day,
          date: new Date(year, month - 1, day),
          isCurrentMonth: false,
        };
      }

      if (index >= firstDay + daysInMonth) {
        const day = index - firstDay - daysInMonth + 1;
        return {
          day,
          date: new Date(year, month + 1, day),
          isCurrentMonth: false,
        };
      }

      const day = index - firstDay + 1;
      return {
        day,
        date: new Date(year, month, day),
        isCurrentMonth: true,
      };
    });
  }, [month, year]);

  const goPreviousMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday = () => onSelectDate(today);

  const isSameDate = (left, right) => left?.toDateString() === right?.toDateString();

  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Month view</p>
          <h3 className="section-subtitle">{monthFormatter.format(viewDate)}</h3>
          <p className="section-copy">
            Select any day to focus on the agenda, restocks, and weekly schedule around it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPreviousMonth}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2C2F45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#050725]"
          >
            <CalendarClock size={15} />
            Today
          </button>
        </div>
      </div>

      <div className="-mx-2 mt-6 overflow-x-auto px-2 pb-1">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#84848A]">
            {dayLabels.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {cells.map((cell) => {
              const selected = isSameDate(selectedDate, cell.date);
              const todaySelected = isSameDate(today, cell.date);

              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  className={`min-h-[88px] rounded-[24px] border px-3 py-3 text-left transition sm:min-h-[102px] ${
                    selected
                      ? "border-[#F9B672] bg-[#F9B672]/18 shadow-[0_12px_26px_rgba(249,182,114,0.16)]"
                      : "border-[#2C2F45]/8 bg-white/70 hover:border-[#F9B672]/35 hover:bg-white"
                  } ${!cell.isCurrentMonth ? "opacity-55" : "opacity-100"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        selected
                          ? "bg-[#2C2F45] text-white"
                          : todaySelected
                          ? "bg-[#050725] text-white"
                          : "text-[#050725]"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {todaySelected && !selected ? (
                      <span className="rounded-full bg-[#050725]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#050725]">
                        Today
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CalendarGrid;
