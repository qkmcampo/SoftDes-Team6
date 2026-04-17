import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Menu } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";

import Sidebar from "./components/Sidebar";
import BrandLogo from "./components/shared/BrandLogo";
import { applySeoMeta } from "./utils/seo";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Profile = lazy(() => import("./pages/Profile"));
const AboutSection = lazy(() => import("./pages/AboutSection"));

const DEMO_SESSION_KEY = "financial_tracker_demo_user";
const demoStorageTargets = ["sessionStorage", "localStorage"];

function buildFirebaseUser(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    fullName: firebaseUser.displayName || "User",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || null,
    provider: firebaseUser.providerData[0]?.providerId || "email",
  };
}

function buildDemoUser(demoUser) {
  const normalizedFullName =
    !demoUser?.fullName || demoUser.fullName === "Keneth Campo"
      ? "Team4"
      : demoUser.fullName;

  return {
    uid: "demo",
    fullName: normalizedFullName,
    email: demoUser?.email || "admin@email.com",
    photoURL: null,
    provider: "demo",
  };
}

function getStoredDemoUser() {
  for (const storageName of demoStorageTargets) {
    try {
      const storage = window[storageName];
      const rawDemoUser = storage.getItem(DEMO_SESSION_KEY);
      if (rawDemoUser) {
        return JSON.parse(rawDemoUser);
      }
    } catch {
      window[storageName]?.removeItem(DEMO_SESSION_KEY);
    }
  }

  return null;
}

function storeDemoUser(demoUser, rememberMe = true) {
  clearStoredDemoUser();

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
}

function clearStoredDemoUser() {
  for (const storageName of demoStorageTargets) {
    window[storageName]?.removeItem(DEMO_SESSION_KEY);
  }
}

function getRouteMeta(pathname) {
  if (pathname.startsWith("/calendar")) {
    return {
      eyebrow: "Planning",
      title: "Calendar",
      seoTitle: "Calendar Planning | Financial Tracker",
      description:
        "Organize bills, supplier schedules, and restocking reminders in the Financial Tracker planning workspace.",
      keywords:
        "calendar planning, retail reminders, restock schedule, supplier timeline, financial tracker calendar",
    };
  }

  if (pathname.startsWith("/assistant")) {
    return {
      eyebrow: "Insights",
      title: "Assistant",
      seoTitle: "AI Assistant | Financial Tracker",
      description:
        "Use the AI financial assistant to review expenses, restocking priorities, and budgeting insights for retail operations.",
      keywords:
        "AI financial assistant, expense analysis, retail budgeting assistant, inventory insights, financial tracker AI",
    };
  }

  if (pathname.startsWith("/profile")) {
    return {
      eyebrow: "Account",
      title: "Profile",
      seoTitle: "Profile Settings | Financial Tracker",
      description:
        "Manage business settings, savings goals, alert thresholds, and account preferences for Financial Tracker.",
      keywords:
        "profile settings, business preferences, savings goals, alert threshold, financial tracker settings",
    };
  }

  if (pathname.startsWith("/about")) {
    return {
      eyebrow: "Overview",
      title: "About",
      seoTitle: "About Financial Tracker",
      description:
        "Learn about Financial Tracker, its retail-focused finance tools, and the team behind the project.",
      keywords:
        "about financial tracker, retail finance system, budget tracker app, inventory monitoring system",
    };
  }

  return {
    eyebrow: "Workspace",
    title: "Dashboard",
    seoTitle: "Dashboard | Financial Tracker",
    description:
      "Monitor balance, cash flow, inventory health, AI recommendations, and analytics in the Financial Tracker dashboard.",
    keywords:
      "financial dashboard, retail finance dashboard, cash flow tracker, budget dashboard, inventory analytics",
  };
}

function RouteFallback() {
  return (
    <div className="min-h-[320px] rounded-[32px] border border-white/60 bg-[#F4E9DA]/80 px-8 py-12 shadow-[0_24px_70px_rgba(5,7,37,0.12)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[24px] border border-[#2C2F45]/10 bg-white/70 p-3 shadow-[0_18px_40px_rgba(5,7,37,0.08)]">
          <BrandLogo className="h-14 w-14" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#84848A]">
            Loading page
          </p>
          <h2 className="text-2xl font-semibold text-[#050725]">
            Preparing your workspace view
          </h2>
          <p className="text-sm leading-6 text-[#6F6F76]">
            Please wait while we load the next section.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppLayout({ user, onLogout }) {
  const location = useLocation();
  const routeMeta = useMemo(() => getRouteMeta(location.pathname), [location.pathname]);
  const firstName = user?.fullName?.trim()?.split(/\s+/)[0] || "Manager";

  useEffect(() => {
    applySeoMeta({
      title: routeMeta.seoTitle,
      description: routeMeta.description,
      keywords: routeMeta.keywords,
      pathname: location.pathname,
    });
  }, [location.pathname, routeMeta]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#ECDFC7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(236,223,199,0.12))]" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(44,47,69,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(44,47,69,0.08) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />
        <div className="absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-[#F9B672]/14 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-[#2C2F45]/8 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen lg:h-screen lg:overflow-hidden">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:h-screen">
          <header className="sticky top-0 z-30 border-b border-white/45 bg-[#ECDFC7]/88 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-[#F4E9DA]/85 shadow-[0_12px_24px_rgba(5,7,37,0.08)]">
                  <BrandLogo className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-[#84848A]">
                    {routeMeta.eyebrow}
                  </p>
                  <p className="truncate text-sm font-semibold text-[#050725]">
                    {routeMeta.title} - {firstName}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#2C2F45]/10 bg-[#F4E9DA]/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2C2F45] shadow-[0_10px_20px_rgba(5,7,37,0.06)]">
                <Menu size={14} className="text-[#F9B672]" />
                Navigate below
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
            <div className="mx-auto w-full max-w-[1500px]">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/profile" element={<Profile user={user} onLogout={onLogout} />} />
                  <Route path="/about" element={<AboutSection />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        clearStoredDemoUser();
        setUser(buildFirebaseUser(firebaseUser));
        setLoading(false);
        return;
      }

      const storedDemoUser = getStoredDemoUser();
      setUser(storedDemoUser ? buildDemoUser(storedDemoUser) : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDemoLogin = (demoUser, options = {}) => {
    const nextDemoUser = buildDemoUser(demoUser);
    storeDemoUser(nextDemoUser, options.rememberMe ?? true);
    setUser(nextDemoUser);
  };

  const handleLogout = async () => {
    clearStoredDemoUser();

    if (user?.provider === "demo") {
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
    } catch {
      // Ignore logout issues so the UI can still recover gracefully.
    }

    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECDFC7] px-6 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center gap-4 rounded-[32px] border border-white/60 bg-[#F4E9DA]/85 px-10 py-12 text-center shadow-[0_24px_70px_rgba(5,7,37,0.14)] backdrop-blur-sm">
          <div className="rounded-[28px] border border-[#2C2F45]/10 bg-white/70 p-3 shadow-[0_18px_40px_rgba(5,7,37,0.08)]">
            <BrandLogo className="h-16 w-16" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#84848A]">
              Preparing your workspace
            </p>
            <h1 className="text-2xl font-semibold text-[#050725]">
              Loading your financial dashboard
            </h1>
            <p className="text-sm leading-6 text-[#6F6F76]">
              We are restoring your secure session and bringing you back to where you left off.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-[#2C2F45]">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#F9B672]" />
            Please wait a moment...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login onDemoLogin={handleDemoLogin} />}
          />

          <Route
            path="/*"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : (
                <AppLayout user={user} onLogout={handleLogout} />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
