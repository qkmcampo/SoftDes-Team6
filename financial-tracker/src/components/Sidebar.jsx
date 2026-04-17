import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Bot, User, Info } from "lucide-react";
import BrandLogo from "./shared/BrandLogo";

function Sidebar() {
  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Calendar",
      path: "/calendar",
      icon: CalendarDays,
    },
    {
      name: "Assistant",
      path: "/assistant",
      icon: Bot,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      name: "About",
      path: "/about",
      icon: Info,
    },
  ];

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-[#050725] text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,182,114,0.16),transparent_48%)]" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F4E9DA] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_24px_rgba(5,7,37,0.22)]">
                <BrandLogo className="h-8 w-8" primary="#050725" accent="#F9B672" />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F9B672]">
                  Gerald Retail
                </p>
                <h1 className="text-sm font-semibold text-white">Financial Tracker</h1>
                <p className="text-xs text-gray-400">Budget prediction workspace</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-2 px-3">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#2C2F45] text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
                      : "text-gray-400 hover:bg-[#2C2F45] hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-2 rounded-[28px] border border-white/70 bg-[#F4E9DA]/88 p-2 shadow-[0_22px_45px_rgba(5,7,37,0.16)] backdrop-blur-xl">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[20px] px-2 py-2 text-center text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-[#2C2F45] text-white shadow-[0_14px_28px_rgba(5,7,37,0.14)]"
                      : "text-[#6F6F76] hover:bg-white/70 hover:text-[#050725]"
                  }`
                }
              >
                <Icon size={17} />
                <span className="leading-tight">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Sidebar;

