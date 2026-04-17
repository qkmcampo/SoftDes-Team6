import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";

function AgendaView({ agendaDays = [], loading = false, selectedDate }) {
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
    <section className="rounded-[30px] border border-white/60 bg-[#F4E9DA] shadow-[0_18px_45px_rgba(5,7,37,0.08)]">
      <div className="flex items-start gap-3 border-b border-[#2C2F45]/10 px-6 py-5 sm:px-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2C2F45] text-[#F9B672]">
          <CalendarDays size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F9B672]">Agenda view</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#050725]">Rolling daily timeline</h3>
          <p className="mt-2 text-sm leading-7 text-[#6F6F76]">
            This agenda refreshes from live business activity and keeps the next days around {selectedLabel} connected to the right workspace sections.
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#2C2F45]/8">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse px-6 py-5 sm:px-7">
                <div className="h-4 w-32 rounded bg-[#2C2F45]/10" />
                <div className="mt-4 h-12 rounded bg-[#2C2F45]/8" />
                <div className="mt-3 h-12 rounded bg-[#2C2F45]/8" />
              </div>
            ))
          : agendaDays.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col gap-4 px-6 py-5 sm:px-7 lg:flex-row ${
                  day.isToday ? "bg-[#F9B672]/8" : day.isSelected ? "bg-white/30" : "bg-transparent"
                }`}
              >
                <div className="lg:w-60 lg:shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${day.isToday ? "text-[#C97D2F]" : "text-[#050725]"}`}>
                      {day.dateLabel}
                    </p>
                    {day.isToday ? (
                      <span className="inline-flex rounded-full bg-[#F9B672]/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#050725]">
                        Today
                      </span>
                    ) : null}
                    {day.isSelected ? (
                      <span className="inline-flex rounded-full border border-[#2C2F45]/10 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">
                        Selected day
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#84848A]">
                    {day.events.length} agenda item{day.events.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex-1 space-y-3">
                  {day.events.map((event, index) => {
                    const Icon = event.icon;

                    return (
                      <button
                        key={`${day.date}-${event.label}-${index}`}
                        type="button"
                        onClick={() => openLink(event.link)}
                        className="interactive-surface flex w-full flex-col gap-3 rounded-[22px] border border-[#2C2F45]/8 bg-white/75 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:flex-row sm:items-start"
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
                          <p className="mt-3 text-sm leading-6 text-[#6F6F76]">{event.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
      </div>

      {!loading && agendaDays.length === 0 ? (
        <div className="px-6 py-10 text-center sm:px-7">
          <Loader2 size={20} className="mx-auto text-[#F9B672]" />
          <p className="mt-3 text-sm font-semibold text-[#050725]">No daily agenda is ready yet</p>
          <p className="mt-2 text-sm leading-6 text-[#6F6F76]">
            Record more activity to turn this timeline into a fuller day-by-day operations view.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default AgendaView;
