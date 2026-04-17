import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { appleProvider, auth, googleProvider } from "../services/firebase";
import BrandLogo from "../components/shared/BrandLogo";
import { applySeoMeta } from "../utils/seo";

const demoAccount = {
  fullName: "Team4",
  email: "admin@email.com",
  password: "admin123",
};

const highlights = [
  {
    icon: BarChart3,
    title: "Live financial visibility",
    text: "Track balances, transactions, and forecasts in one focused control center.",
  },
  {
    icon: Wallet,
    title: "Faster daily decisions",
    text: "Surface cash movement, stock pressure, and planning insights without switching tools.",
  },
  {
    icon: ShieldCheck,
    title: "Secure workspace access",
    text: "Use protected sign-in flows, return safely after refresh, and keep your team aligned.",
  },
];

const privacyPoints = [
  "Account authentication is handled through Firebase Authentication.",
  "Financial records stay inside the Gerald Retail workspace and should only be accessed by authorized users.",
  "Social sign-in follows the security policies of the selected provider.",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.467 2.223-1.215 3.01-.802.83-2.11 1.47-3.243 1.38-.147-1.08.373-2.23 1.108-3 .806-.84 2.213-1.44 3.35-1.39Zm4.49 16.53c-.41.95-.896 1.83-1.459 2.64-.767 1.09-1.393 1.85-1.879 2.29-.753.72-1.56 1.09-2.422 1.12-.62 0-1.37-.18-2.247-.54-.88-.36-1.688-.54-2.423-.54-.77 0-1.595.18-2.48.54-.886.36-1.599.55-2.14.57-.827.04-1.653-.34-2.48-1.15-.527-.46-1.18-1.25-1.96-2.38-.838-1.2-1.526-2.59-2.064-4.16-.575-1.69-.863-3.33-.863-4.91 0-1.81.39-3.37 1.168-4.68.61-1.06 1.42-1.9 2.432-2.51 1.011-.61 2.106-.93 3.287-.96.646 0 1.494.2 2.545.6 1.048.4 1.72.6 2.014.6.22 0 .97-.23 2.245-.69 1.205-.43 2.222-.61 3.049-.54 2.245.18 3.933 1.07 5.063 2.69-2.01 1.22-3.005 2.93-2.987 5.12.016 1.71.638 3.13 1.864 4.26.554.52 1.172.92 1.856 1.2-.149.43-.306.85-.472 1.25Z" />
    </svg>
  );
}

function getInputClassName(hasError = false) {
  return `mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#050725] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition placeholder:text-[#84848A] focus:border-[#F9B672] focus:ring-4 focus:ring-[#F9B672]/20 ${
    hasError ? "border-red-300 bg-red-50/40" : "border-[#2C2F45]/10"
  }`;
}

function getFormErrors({ isSignUp, fullName, email, password, confirmPassword }) {
  return {
    fullName: isSignUp
      ? !fullName.trim()
        ? "Please enter your full name."
        : fullName.trim().length < 2
        ? "Use at least 2 characters for your name."
        : ""
      : "",
    email: !email.trim()
      ? "Please enter your email address."
      : !emailPattern.test(email.trim())
      ? "Please use a valid email address."
      : "",
    password: !password.trim()
      ? "Please enter your password."
      : isSignUp && password.length < 6
      ? "Password must be at least 6 characters."
      : "",
    confirmPassword: isSignUp
      ? !confirmPassword.trim()
        ? "Please confirm your password."
        : confirmPassword !== password
        ? "Passwords do not match."
        : ""
      : "",
  };
}

function getResetEmailError(resetEmail) {
  if (!resetEmail.trim()) {
    return "Please enter your email address.";
  }

  if (!emailPattern.test(resetEmail.trim())) {
    return "Please use a valid email address.";
  }

  return "";
}

function Login({ onDemoLogin }) {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    resetEmail: false,
  });

  const fieldErrors = useMemo(
    () => getFormErrors({ isSignUp, fullName, email, password, confirmPassword }),
    [confirmPassword, email, fullName, isSignUp, password]
  );
  const resetEmailError = useMemo(() => getResetEmailError(resetEmail), [resetEmail]);
  const isBusy = Boolean(loadingAction);

  useEffect(() => {
    applySeoMeta({
      title: isSignUp ? "Create Account | Financial Tracker" : "Sign In | Financial Tracker",
      description:
        "Access Financial Tracker for retail budgeting, expense tracking, inventory planning, calendar reminders, and AI-assisted financial insights.",
      keywords:
        "financial tracker login, retail budgeting platform, expense tracking app, AI financial assistant, inventory planning dashboard",
      pathname: "/login",
    });
  }, [isSignUp]);

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const markTouched = (field) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  };

  const markFormTouched = () => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    }));
  };

  const applyChosenPersistence = async () => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/user-not-found":
        return "No account was found with that email address.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid credentials. Please check your email and password.";
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in instead.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts were detected. Please wait and try again.";
      case "auth/popup-closed-by-user":
        return "The sign-in popup was closed before completing authentication.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not yet enabled for the current Firebase project.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with a different sign-in method for this email.";
      case "auth/unauthorized-domain":
        return "This browser domain is not yet authorized for social sign-in.";
      default:
        return "We could not complete the sign-in request. Please try again.";
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (fieldErrors.email || fieldErrors.password) {
      markFormTouched();
      setError(fieldErrors.email || fieldErrors.password);
      return;
    }

    setLoadingAction("signin");

    try {
      await applyChosenPersistence();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (firebaseError) {
      if (email.trim() === demoAccount.email && password === demoAccount.password) {
        onDemoLogin?.(
          {
            fullName: demoAccount.fullName,
            email: demoAccount.email,
          },
          { rememberMe }
        );
        navigate("/dashboard", { replace: true });
      } else {
        setError(getErrorMessage(firebaseError.code));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (fieldErrors.fullName || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword) {
      markFormTouched();
      setError(
        fieldErrors.fullName ||
          fieldErrors.email ||
          fieldErrors.password ||
          fieldErrors.confirmPassword
      );
      return;
    }

    setLoadingAction("signup");

    try {
      await applyChosenPersistence();
      const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credentials.user, {
        displayName: fullName.trim(),
      });
      setIsSignUp(false);
      setSuccess("Account created successfully. Please sign in to continue.");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setTouched((currentTouched) => ({
        ...currentTouched,
        fullName: false,
        password: false,
        confirmPassword: false,
      }));
    } catch (firebaseError) {
      setError(getErrorMessage(firebaseError.code));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSocialSignIn = async (provider, providerName) => {
    clearFeedback();
    setLoadingAction(providerName);

    try {
      await applyChosenPersistence();
      await signInWithPopup(auth, provider);
      navigate("/dashboard", { replace: true });
    } catch (firebaseError) {
      setError(getErrorMessage(firebaseError.code));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");

    if (resetEmailError) {
      setTouched((currentTouched) => ({ ...currentTouched, resetEmail: true }));
      setError(resetEmailError);
      return;
    }

    setLoadingAction("reset");

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setShowForgotModal(false);
      setSuccess("Password reset email sent. Please check your inbox.");
      setResetEmail("");
      setTouched((currentTouched) => ({ ...currentTouched, resetEmail: false }));
    } catch (firebaseError) {
      setError(getErrorMessage(firebaseError.code));
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleMode = () => {
    setIsSignUp((currentMode) => !currentMode);
    clearFeedback();
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setTouched({
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false,
      resetEmail: false,
    });
  };

  const socialButtons = [
    {
      key: "google",
      label: "Continue with Google",
      icon: <GoogleMark />,
      onClick: () => handleSocialSignIn(googleProvider, "google"),
      className: "border-[#2C2F45]/10 bg-white/82 text-[#050725] hover:bg-white",
    },
    {
      key: "apple",
      label: "Continue with Apple",
      icon: <AppleMark />,
      onClick: () => handleSocialSignIn(appleProvider, "apple"),
      className: "border-[#050725]/15 bg-[#050725] text-white hover:bg-[#111532]",
    },
  ];

  const renderFieldHint = (message, id) =>
    message ? (
      <p id={id} className="mt-1.5 text-xs font-medium text-red-600" role="status">
        {message}
      </p>
    ) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#ECDFC7] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(244,233,218,0.12))]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(44,47,69,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(44,47,69,0.05) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />
        <div className="animate-float-soft absolute left-[6%] top-[18%] h-72 w-72 rounded-full bg-[#F9B672]/18 blur-3xl" />
        <div className="animate-float-slower absolute right-[9%] top-[16%] h-80 w-80 rounded-full bg-[#2C2F45]/10 blur-3xl" />
        <div className="animate-float-soft absolute bottom-[10%] left-[14%] h-52 w-80 rounded-[999px] border border-white/35 bg-white/10 rotate-[-10deg]" />
        <div className="animate-float-slower absolute bottom-[8%] right-[12%] h-80 w-56 rounded-[72px] border border-white/32 bg-white/8 rotate-[14deg]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-[#F4E9DA]/90 shadow-[0_28px_90px_rgba(5,7,37,0.18)] backdrop-blur-sm lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden bg-[#2C2F45] px-7 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,182,114,0.22),transparent_45%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_50%)]" />
          <div className="relative flex h-full flex-col">
            <div className="animate-fade-in flex items-center gap-4">
              <div className="rounded-[26px] border border-white/10 bg-white/10 p-3 shadow-[0_18px_35px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <BrandLogo className="h-16 w-16" primary="#F4E9DA" accent="#F9B672" title="Financial Tracker logo" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#F9B672]">
                  Gerald Retail
                </p>
                <h1 className="mt-1 text-xl font-semibold">Financial Tracker</h1>
                <p className="text-sm text-white/70">Budgeting, inventory planning, and AI guidance in one workspace.</p>
              </div>
            </div>

            <div className="mt-10 max-w-xl animate-slide-up">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#F9B672]">
                Smarter daily operations
              </p>
              <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight sm:text-[2.7rem]">
                Sign in to a calmer retail finance workspace.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-[15px]">
                Stay close to balances, schedules, stock pressure, and assistant insights with a secure login flow that feels polished and easy to trust.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {highlights.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="animate-slide-up flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F9B672]/20 text-[#F9B672]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/70">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/10 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.14)] backdrop-blur-sm animate-slide-up">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Workspace preview</p>
                  <p className="mt-2 text-lg font-semibold text-white">A quick look at the control center</p>
                </div>
                <span className="rounded-full bg-[#F9B672]/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F9B672]">
                  Live feel
                </span>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-white/10 bg-[#F4E9DA]/10 p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Balance snapshot</p>
                      <p className="mt-2 text-3xl font-semibold text-white">PHP 18.4K</p>
                      <p className="mt-2 text-sm text-white/65">Updated alongside transactions and sales activity.</p>
                    </div>
                    <div className="h-20 w-24 rounded-[22px] bg-[linear-gradient(180deg,rgba(249,182,114,0.7),rgba(249,182,114,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="animate-float-soft rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Restock watch</p>
                    <p className="mt-2 text-base font-semibold text-white">4 items need attention</p>
                  </div>
                  <div className="animate-float-slower rounded-[24px] border border-white/10 bg-white/10 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Assistant brief</p>
                    <p className="mt-2 text-base font-semibold text-white">Expense trend ready for review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(249,182,114,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(44,47,69,0.08),transparent_34%)] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08))]" />
            <div
              className="absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(44,47,69,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(44,47,69,0.04) 1px, transparent 1px)",
                backgroundSize: "84px 84px",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col justify-center rounded-[32px] border border-white/65 bg-[#F4E9DA]/72 px-5 py-6 shadow-[0_24px_55px_rgba(5,7,37,0.08)] backdrop-blur-md sm:px-6 sm:py-7">
            <div className="mb-8 animate-fade-in">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#84848A]">
                {isSignUp ? "Create your account" : "Welcome back"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#050725]">
                {isSignUp ? "Create your secure workspace access" : "Sign in to continue"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#6F6F76]">
                {isSignUp
                  ? "Create an account to manage cash flow, inventory planning, and AI insights in one place."
                  : "Use your preferred sign-in method and return directly to the Gerald Retail workspace."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-[22px] border border-[#2C2F45]/10 bg-[#ECDFC7]/60 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <button
                type="button"
                onClick={() => {
                  if (isSignUp) {
                    toggleMode();
                  }
                }}
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  !isSignUp
                    ? "bg-[#2C2F45] text-white shadow-[0_12px_25px_rgba(5,7,37,0.15)]"
                    : "text-[#6F6F76] hover:text-[#050725]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSignUp) {
                    toggleMode();
                  }
                }}
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  isSignUp
                    ? "bg-[#2C2F45] text-white shadow-[0_12px_25px_rgba(5,7,37,0.15)]"
                    : "text-[#6F6F76] hover:text-[#050725]"
                }`}
              >
                Create Account
              </button>
            </div>

            <div aria-live="polite" className="space-y-3">
              {success ? (
                <div role="status" className="flex items-start gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-3.5 shadow-[0_16px_35px_rgba(46,111,78,0.08)]">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2E6F4E]" />
                  <div className="flex-1 text-sm leading-6 text-[#2E6F4E]">{success}</div>
                  <button type="button" onClick={() => setSuccess("")} className="text-[#2E6F4E] transition hover:text-[#1e5539]" aria-label="Dismiss success message">
                    <X size={16} />
                  </button>
                </div>
              ) : null}

              {error && !showForgotModal ? (
                <div role="alert" className="flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50/90 px-4 py-3.5 shadow-[0_16px_35px_rgba(185,53,53,0.08)]">
                  <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  <div className="flex-1 text-sm leading-6 text-red-700">{error}</div>
                  <button type="button" onClick={() => setError("")} className="text-red-700 transition hover:text-red-800" aria-label="Dismiss error message">
                    <X size={16} />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {socialButtons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  onClick={button.onClick}
                  disabled={isBusy}
                  aria-label={button.label}
                  className={`flex items-center justify-center gap-3 rounded-[22px] border px-4 py-3.5 text-sm font-medium shadow-[0_14px_32px_rgba(5,7,37,0.08)] transition disabled:cursor-not-allowed disabled:opacity-50 ${button.className}`}
                >
                  {loadingAction === button.key ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    button.icon
                  )}
                  {button.label}
                </button>
              ))}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2C2F45]/10" />
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#84848A]">or continue with email</span>
              <div className="h-px flex-1 bg-[#2C2F45]/10" />
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4" noValidate>
              {isSignUp ? (
                <div>
                  <label htmlFor="login-full-name" className="text-sm font-medium text-[#5F5F66]">
                    Full Name
                  </label>
                  <input
                    id="login-full-name"
                    type="text"
                    placeholder="Gerald Retail Manager"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    onBlur={() => markTouched("fullName")}
                    autoComplete="name"
                    aria-invalid={Boolean(touched.fullName && fieldErrors.fullName)}
                    aria-describedby={touched.fullName && fieldErrors.fullName ? "full-name-error" : undefined}
                    className={getInputClassName(Boolean(touched.fullName && fieldErrors.fullName))}
                  />
                  {renderFieldHint(touched.fullName ? fieldErrors.fullName : "", "full-name-error")}
                </div>
              ) : null}

              <div>
                <label htmlFor="login-email" className="text-sm font-medium text-[#5F5F66]">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => markTouched("email")}
                  autoComplete="email"
                  aria-invalid={Boolean(touched.email && fieldErrors.email)}
                  aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                  className={getInputClassName(Boolean(touched.email && fieldErrors.email))}
                />
                {renderFieldHint(touched.email ? fieldErrors.email : "", "email-error")}
              </div>

              <div>
                <label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium text-[#5F5F66]">
                  <LockKeyhole size={15} className="text-[#84848A]" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "Minimum 6 characters" : "Enter your password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => markTouched("password")}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    aria-invalid={Boolean(touched.password && fieldErrors.password)}
                    aria-describedby={touched.password && fieldErrors.password ? "password-error" : undefined}
                    className={`${getInputClassName(Boolean(touched.password && fieldErrors.password))} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((currentState) => !currentState)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#84848A] transition hover:text-[#050725]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {renderFieldHint(touched.password ? fieldErrors.password : "", "password-error")}
              </div>

              {isSignUp ? (
                <div>
                  <label htmlFor="login-confirm-password" className="text-sm font-medium text-[#5F5F66]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      onBlur={() => markTouched("confirmPassword")}
                      autoComplete="new-password"
                      aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
                      aria-describedby={
                        touched.confirmPassword && fieldErrors.confirmPassword ? "confirm-password-error" : undefined
                      }
                      className={`${getInputClassName(Boolean(touched.confirmPassword && fieldErrors.confirmPassword))} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((currentState) => !currentState)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#84848A] transition hover:text-[#050725]"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {renderFieldHint(
                    touched.confirmPassword ? fieldErrors.confirmPassword : "",
                    "confirm-password-error"
                  )}
                </div>
              ) : null}

              {!isSignUp ? (
                <div className="flex flex-col gap-3 rounded-[22px] border border-[#2C2F45]/10 bg-white/55 px-4 py-3 text-sm text-[#6F6F76] sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-3 font-medium text-[#050725]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-[#2C2F45]/20 text-[#2C2F45] focus:ring-[#F9B672]"
                    />
                    Remember me on this device
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setError("");
                    }}
                    className="text-left text-xs font-semibold text-[#F9B672] transition hover:text-[#e5a25e] sm:text-right"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#2C2F45] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(5,7,37,0.16)] transition hover:bg-[#050725] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "signin" || loadingAction === "signup" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : isSignUp ? (
                  <UserPlus size={18} />
                ) : (
                  <LogIn size={18} />
                )}
                {loadingAction === "signin" || loadingAction === "signup"
                  ? "Please wait..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#2C2F45]/10 bg-white/55 px-4 py-3 text-xs text-[#6F6F76]">
              <div className="inline-flex items-center gap-2 font-medium text-[#050725]">
                <ShieldCheck size={14} className="text-[#2E6F4E]" />
                SSL secured session
              </div>
              <div className="inline-flex items-center gap-3">
                <span>Keyboard accessible</span>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="font-semibold text-[#2C2F45] underline underline-offset-4 transition hover:text-[#050725]"
                >
                  Privacy policy
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-[#6F6F76]">
              {isSignUp ? "Already have an account?" : "Do not have an account yet?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-[#2C2F45] transition hover:text-[#050725]"
              >
                {isSignUp ? "Back to Sign In" : "Create one now"}
              </button>
            </p>
          </div>
        </section>
      </div>

      {showForgotModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050725]/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-[#F4E9DA] p-6 shadow-[0_28px_80px_rgba(5,7,37,0.18)] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#84848A]">Password support</p>
                <h3 id="forgot-password-title" className="mt-2 text-2xl font-semibold text-[#050725]">
                  Reset your password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetEmail("");
                  setError("");
                }}
                className="text-[#84848A] transition hover:text-[#050725]"
                aria-label="Close password reset dialog"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#6F6F76]">
              Enter the email address connected to your account and we will send a secure reset link.
            </p>

            {error ? (
              <div role="alert" className="mt-4 rounded-[20px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleForgotPassword} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium text-[#5F5F66]">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  onBlur={() => markTouched("resetEmail")}
                  autoComplete="email"
                  aria-invalid={Boolean(touched.resetEmail && resetEmailError)}
                  aria-describedby={touched.resetEmail && resetEmailError ? "reset-email-error" : undefined}
                  className={getInputClassName(Boolean(touched.resetEmail && resetEmailError))}
                />
                {renderFieldHint(touched.resetEmail ? resetEmailError : "", "reset-email-error")}
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#F9B672] px-4 py-3.5 text-sm font-semibold text-[#050725] shadow-[0_18px_35px_rgba(249,182,114,0.22)] transition hover:bg-[#efac68] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "reset" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#050725] border-t-transparent" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showPrivacyModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050725]/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[30px] border border-white/70 bg-[#F4E9DA] p-6 shadow-[0_28px_80px_rgba(5,7,37,0.18)] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="privacy-policy-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#84848A]">Privacy</p>
                <h3 id="privacy-policy-title" className="mt-2 text-2xl font-semibold text-[#050725]">
                  Privacy policy overview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-[#84848A] transition hover:text-[#050725]"
                aria-label="Close privacy policy dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#2C2F45]/10 bg-white/65 p-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#2E6F4E]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6F4E]">
                <ShieldCheck size={12} />
                Protected access
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#6F6F76]">
                {privacyPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Sparkles size={14} className="mt-1 shrink-0 text-[#F9B672]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Login;
