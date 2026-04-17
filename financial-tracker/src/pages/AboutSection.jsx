import {
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarDays,
  Cpu,
  LayoutDashboard,
  Network,
  Package,
  Shield,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/shared/BrandLogo";

const teamMembers = [
  {
    name: "Keneth Campo",
    role: "Leader",
    track: "System Administration",
    color: "#F9B672",
    initials: "KC",
    photo: "/team/Keneth_Campo.jpg",
  },
  {
    name: "Angelo Base",
    role: "Member",
    track: "Data Science",
    color: "#2E6F4E",
    initials: "AB",
    photo: "/team/Angelo_Base.jpg",
  },
  {
    name: "Gwyneth Esperat",
    role: "Member",
    track: "Data Science",
    color: "#2C2F45",
    initials: "GE",
    photo: "/team/Gwyneth_Esperat.jpg",
  },
  {
    name: "Pamela Malazarte",
    role: "Member",
    track: "Cyber Physical System",
    color: "#84848A",
    initials: "PM",
    photo: "/team/Pamela_Malazarte.jpg",
  },
  {
    name: "Maynard Refugia",
    role: "Member",
    track: "Cyber Physical System",
    color: "#050725",
    initials: "MR",
    photo: "/team/Maynard_Refugia.jpg",
  },
];

const appFeatures = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Track balance, analytics, predictions, and recent transactions in one clear workspace.",
    link: "/dashboard#analytics-section",
    focusSection: "analytics-section",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description: "Plan bills, supplier tasks, and restock schedules through focused calendar views.",
    link: "/calendar#agenda-panel",
    focusSection: "agenda-panel",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Ask practical questions about expenses, restocks, savings, and financial patterns.",
    link: "/assistant#conversation-panel",
    focusSection: "conversation-panel",
  },
  {
    icon: UserCircle,
    title: "Profile",
    description: "Manage account details, preferences, security, and assistant behavior in one place.",
    link: "/profile#financial-settings",
    focusSection: "financial-settings",
  },
  {
    icon: Package,
    title: "Inventory Monitoring",
    description: "Surface LOW and CRITICAL stock conditions and respond with clear restock actions.",
    link: "/calendar#restock-panel",
    focusSection: "restock-panel",
  },
  {
    icon: TrendingUp,
    title: "Budget Prediction",
    description: "Use forecasting to guide monthly planning from recent store activity and sales history.",
    link: "/dashboard#budget-outlook",
    focusSection: "budget-outlook",
  },
];

const quickSteps = [
  "Sign in using your email account or Google access.",
  "Record income and expense transactions from the dashboard.",
  "Use Calendar to review schedules, reminders, and restock timing.",
  "Ask the Assistant for budget analysis, low-stock checks, and summaries.",
  "Review Profile settings to keep business details and planning targets updated.",
];

function AboutSection() {
  const navigate = useNavigate();
  const leader = teamMembers.find((member) => member.role === "Leader");
  const contributors = teamMembers.filter((member) => member.role !== "Leader");

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel-pad">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="icon-chip h-14 w-14 rounded-[20px]">
              <BrandLogo className="h-8 w-8" primary="#F4E9DA" accent="#F9B672" title="Financial Tracker logo" />
            </div>
            <div className="max-w-3xl">
              <p className="section-eyebrow">About</p>
              <h1 className="section-title">Financial Tracker</h1>
              <p className="section-copy">
                A financial workspace for Gerald Retail with budgeting, planning, inventory awareness, and assistant guidance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em]">
            <span className="info-pill">Version 1.0</span>
            <span className="info-pill text-[#6F6F76]">Software Design</span>
            <span className="info-pill text-[#6F6F76]">2025-2026</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px]">
        <section className="surface-panel surface-panel-pad">
          <div className="flex items-start gap-3">
            <div className="icon-chip h-10 w-10">
              <BookOpen size={17} />
            </div>
            <div>
              <p className="section-eyebrow">Overview</p>
              <h2 className="section-subtitle">What the system helps you manage</h2>
              <p className="section-copy">
                The platform is designed to make daily store decisions easier to read, track, and explain.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {appFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() =>
                    navigate(feature.link, {
                      state: {
                        focusSection: feature.focusSection,
                        focusNonce: Date.now(),
                      },
                    })
                  }
                  className="surface-card interactive-surface px-4 py-4 text-left hover:border-[#F9B672]/25"
                >
                  <div className="icon-chip h-10 w-10">
                    <Icon size={17} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#050725]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6F6F76]">{feature.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface-panel surface-panel-pad">
          <div className="flex items-start gap-3">
            <div className="icon-chip h-10 w-10">
              <Shield size={17} />
            </div>
            <div>
              <p className="section-eyebrow">Quick start</p>
              <h2 className="section-subtitle">How to begin using the system</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {quickSteps.map((step, index) => (
              <div key={step} className="surface-card flex items-start gap-3 px-4 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F9B672] text-xs font-bold text-[#050725]">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-[#6F6F76]">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-panel surface-panel-pad">
        <div className="flex items-start gap-3">
          <div className="icon-chip h-10 w-10">
            <Users size={17} />
          </div>
          <div>
            <p className="section-eyebrow">Team</p>
            <h2 className="section-subtitle">Meet the development group</h2>
            <p className="section-copy">
              Bachelor of Science in Computer Engineering, Technological Institute of the Philippines.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {leader ? (
            <article className="rounded-[24px] border border-[#2C2F45] bg-[#2C2F45] px-5 py-5 text-white shadow-[0_18px_40px_rgba(5,7,37,0.12)]">
              <div className="mt-4 flex items-start gap-4">
                {leader.photo ? (
                  <img
                    src={leader.photo}
                    alt={leader.name}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="h-20 w-20 rounded-[24px] object-cover shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-[24px] text-xl font-bold"
                    style={{ backgroundColor: "#F9B672", color: "#050725" }}
                  >
                    {leader.initials}
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-semibold">{leader.name}</h3>
                  <p className="mt-2 text-sm text-white/70">{leader.track}</p>
                </div>
              </div>
            </article>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {contributors.map((member) => {
            const isLeader = member.role === "Leader";
            const TrackIcon =
              member.track === "System Administration"
                ? Shield
                : member.track === "Data Science"
                ? BrainCircuit
                : Network;

              return (
                <div
                  key={member.name}
                  className={`rounded-[20px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                    isLeader
                      ? "border-[#2C2F45] bg-[#2C2F45] text-white"
                      : "border-[#2C2F45]/8 bg-white/75 text-[#050725]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-2xl object-cover shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold"
                        style={{ backgroundColor: isLeader ? "#F9B672" : `${member.color}18`, color: isLeader ? "#050725" : member.color }}
                      >
                        {member.initials}
                      </div>
                    )}
                  </div>

                  <h3 className={`mt-4 text-lg font-semibold ${isLeader ? "text-white" : "text-[#050725]"}`}>
                    {member.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <TrackIcon size={14} className={isLeader ? "text-white/65" : "text-[#84848A]"} />
                    <span className={isLeader ? "text-white/70" : "text-[#6F6F76]"}>{member.track}</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ECDFC7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6F76]">
                    <Cpu size={10} />
                    CPE
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutSection;
