import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";

function AgendaPanel({ agendaDays = [], loading = false, selectedDate }) {
  const navigate = useNavigate();
  const selectedLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(selectedDate);

  const openLink = (link) => {
    const [, focusSection = ""] = link.split("#");
    navigate(link, {
      state: focusSection
        ? {
            focusSection,
            focusNonce: Date.now(),
          }
        : undefined,
    });
  };

  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex items-start gap-3">
        <div className="icon-chip h-11 w-11">
          <CalendarDays size={18} />
        </div>
        <div>
          <p className="section-eyebrow">Agenda details</p>
          <h3 className="section-subtitle">Daily agenda linked to your latest records</h3>
          <p className="section-copy">
            The schedule below refreshes from current transactions, sales, and stock activity for {selectedLabel} onward.
          </p>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <li
                key={index}
                className="animate-pulse rounded-[24px] border border-[#2C2F45]/8 bg-white/70 px-4 py-4"
              >
                <div className="h-4 w-28 rounded bg-[#2C2F45]/10" />
                <div className="mt-4 h-10 rounded bg-[#2C2F45]/8" />
              </li>
            ))
          : agendaDays.map((day) => (
              <li
                key={day.date}
                className={`rounded-[24px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${
                  day.isToday
                    ? "border-[#F9B672]/35 bg-[#F9B672]/10"
                    : day.isSelected
                    ? "border-[#2C2F45]/12 bg-white/78"
                    : "border-[#2C2F45]/8 bg-white/70"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="lg:w-48">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#050725]">{day.dateLabel}</p>
                      {day.isToday ? (
                        <span className="rounded-full bg-[#F9B672]/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#050725]">
                          Today
                        </span>
                      ) : null}
                      {day.isSelected ? (
                        <span className="rounded-full border border-[#2C2F45]/10 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#84848A]">
                      {day.events.length} planned update{day.events.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {day.events.map((event, index) => {
                      const Icon = event.icon;

                      return (
                        <button
                          key={`${day.date}-${event.label}-${index}`}
                          type="button"
                          onClick={() => openLink(event.link)}
                          className="interactive-surface flex w-full flex-col gap-3 rounded-[22px] border border-[#2C2F45]/8 bg-white/80 px-4 py-3 text-left sm:flex-row sm:items-center"
                        >
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#ECDFC7] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">
                            <Clock3 size={12} />
                            {event.time}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${event.color}`}>
                              <Icon size={12} />
                              {event.label}
                            </span>
                            <p className="mt-2 text-sm leading-6 text-[#6F6F76]">{event.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
      </ul>

      {!loading && agendaDays.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#2C2F45]/12 bg-white/45 px-5 py-10 text-center">
          <Loader2 size={20} className="mx-auto text-[#F9B672]" />
          <p className="mt-3 text-sm font-semibold text-[#050725]">No agenda data is ready yet</p>
          <p className="mt-2 text-sm leading-6 text-[#6F6F76]">
            Add transactions, sales, or inventory updates to generate a more detailed daily timeline.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default AgendaPanel;
