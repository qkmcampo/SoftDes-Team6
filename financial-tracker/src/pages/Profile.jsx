import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bot,
  ChevronDown,
  LogOut,
  Pencil,
  PiggyBank,
  Save,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useSectionFocus from "../hooks/useSectionFocus";

function Profile({ user, onLogout }) {
  const navigate = useNavigate();
  const accountInfoRef = useRef(null);
  const financialSettingsRef = useRef(null);
  const assistantSecurityRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullName: user?.fullName || "Team4",
    email: user?.email || "admin@email.com",
    businessName: "Gerald Retail Store",
    phone: "+63 912 345 6789",
    address: "Quezon City, Metro Manila",
  });
  const [editBuffer, setEditBuffer] = useState({ ...userInfo });
  const [preferences, setPreferences] = useState({
    currency: "PHP",
    monthlyBudget: "32000",
    savingsGoal: "10",
    alertThreshold: "20",
    fiscalYearStart: "January",
  });
  const [aiSettings, setAiSettings] = useState({
    autoRecommendations: true,
    restockAlerts: true,
    budgetWarnings: true,
    salesForecasting: true,
    assistantTone: "Professional",
  });

  const accountStats = {
    totalTransactions: 128,
    totalExpenses: "P58,420.00",
    totalIncome: "P120,456.00",
    inventoryItems: 24,
    memberSince: "September 2024",
  };

  const photoURL = user?.photoURL || null;
  const provider = user?.provider || "demo";

  const providerLabel =
    provider === "google.com"
      ? "Google"
      : provider === "demo"
      ? "Demo"
      : "Email";

  const profileSignals = [
    {
      label: "Provider",
      value: providerLabel,
      tone: "default",
      focusSection: "account-information",
    },
    {
      label: "Savings target",
      value: `${preferences.savingsGoal}%`,
      tone: "accent",
      focusSection: "financial-settings",
    },
    {
      label: "Alert threshold",
      value: `${preferences.alertThreshold}%`,
      tone: "success",
      focusSection: "financial-settings",
    },
  ];

  const sectionRefs = useMemo(
    () => ({
      "account-information": accountInfoRef,
      "financial-settings": financialSettingsRef,
      "assistant-security": assistantSecurityRef,
    }),
    []
  );

  const focusedSection = useSectionFocus(sectionRefs);

  const focusSection = (sectionId) => {
    sectionRefs[sectionId]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleLogout = () => {
    onLogout?.();
    navigate("/login");
  };

  const handleEditToggle = () => {
    setEditBuffer({ ...userInfo });
    setIsEditing((currentValue) => !currentValue);
  };

  const handleSaveProfile = () => {
    setUserInfo({ ...editBuffer });
    setIsEditing(false);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((previousState) => ({ ...previousState, [key]: value }));
  };

  const handleAiToggle = (key) => {
    setAiSettings((previousState) => ({
      ...previousState,
      [key]: !previousState[key],
    }));
  };

  const handleAiSelectChange = (key, value) => {
    setAiSettings((previousState) => ({ ...previousState, [key]: value }));
  };

  const SectionCard = ({ eyebrow, title, description, icon: Icon, children }) => (
    <section className="surface-panel surface-panel-pad">
      <div className="flex items-start gap-3">
        <div className="icon-chip h-10 w-10">
          <Icon size={17} />
        </div>
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 className="section-subtitle">{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );

  const DataRow = ({ label, value }) => (
    <div className="surface-card flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[#84848A]">{label}</span>
      <span className="text-sm font-semibold text-[#050725]">{value}</span>
    </div>
  );

  const EditRow = ({ label, fieldKey }) => (
    <div className="surface-card flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[#84848A]">{label}</span>
      <input
        type="text"
        value={editBuffer[fieldKey]}
        onChange={(event) =>
          setEditBuffer((previousState) => ({
            ...previousState,
            [fieldKey]: event.target.value,
          }))
        }
        className="w-full rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm font-medium text-[#050725] outline-none focus:border-[#F9B672] sm:w-72"
      />
    </div>
  );

  const PreferenceRow = ({ label, description, control }) => (
    <div className="surface-card flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#050725]">{label}</p>
        <p className="mt-1 text-xs leading-6 text-[#84848A]">{description}</p>
      </div>
      {control}
    </div>
  );

  const CompactRow = ({ label, value, control }) => (
    <div className="surface-card flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm font-semibold text-[#050725]">{label}</p>
      {control ? (
        control
      ) : (
        <span className="text-sm font-medium text-[#6F6F76] text-right">{value}</span>
      )}
    </div>
  );

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-[#2E6F4E]" : "bg-[#84848A]/30"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`}
      />
    </button>
  );

  const SelectDropdown = ({ value, options, onChange }) => (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 pr-10 text-sm font-medium text-[#050725] outline-none focus:border-[#F9B672]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#84848A]" />
    </div>
  );

  const StatTile = ({ icon: Icon, label, value, tone = "default" }) => {
    const toneClasses = {
      default: "bg-[#2C2F45]/10 text-[#2C2F45]",
      success: "bg-[#2E6F4E]/14 text-[#2E6F4E]",
      danger: "bg-red-100 text-red-700",
      accent: "bg-[#F9B672]/18 text-[#C97D2F]",
    };

    return (
      <div className="surface-card px-4 py-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[tone] || toneClasses.default}`}>
          <Icon size={18} />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#84848A]">{label}</p>
        <p className="mt-2 text-lg font-semibold text-[#050725]">{value}</p>
      </div>
    );
  };

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel-pad">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="h-[4.5rem] w-[4.5rem] rounded-[22px] object-cover shadow-[0_14px_28px_rgba(5,7,37,0.12)] sm:h-20 sm:w-20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[22px] bg-[#2C2F45] text-white shadow-[0_14px_28px_rgba(5,7,37,0.12)] sm:h-20 sm:w-20">
                <User size={28} />
              </div>
            )}

            <div>
              <p className="section-eyebrow">Profile</p>
              <h1 className="section-title">{userInfo.fullName}</h1>
              <p className="mt-2 text-base text-[#6F6F76]">{userInfo.businessName}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em]">
                <span className="info-pill">{providerLabel} sign-in</span>
                <span className="info-pill text-[#6F6F76]">Member since {accountStats.memberSince}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={isEditing ? handleSaveProfile : handleEditToggle}
              className={`inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold transition ${
                isEditing
                  ? "bg-[#2E6F4E] text-white hover:bg-[#245a3f]"
                  : "bg-[#2C2F45] text-white hover:bg-[#050725]"
              }`}
            >
              {isEditing ? <Save size={16} /> : <Pencil size={16} />}
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-[20px] border border-[#2C2F45]/10 bg-white/80 px-5 py-3 text-sm font-semibold text-[#050725] transition hover:bg-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6">
          <div
            ref={accountInfoRef}
            className={`section-anchor ${focusedSection === "account-information" ? "section-focus-highlight" : ""}`}
          >
            <SectionCard
              eyebrow="Account"
              title="Personal and business information"
              description="Keep your core account details accurate for reporting and daily use."
              icon={User}
            >
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <EditRow label="Full Name" fieldKey="fullName" />
                    <EditRow label="Email" fieldKey="email" />
                    <EditRow label="Business Name" fieldKey="businessName" />
                    <EditRow label="Phone" fieldKey="phone" />
                    <EditRow label="Address" fieldKey="address" />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#2C2F45]/10 bg-white/80 px-4 py-3 text-sm font-medium text-[#6F6F76] transition hover:text-[#050725]"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <DataRow label="Full Name" value={userInfo.fullName} />
                    <DataRow label="Email" value={userInfo.email} />
                    <DataRow label="Business Name" value={userInfo.businessName} />
                    <DataRow label="Phone" value={userInfo.phone} />
                    <DataRow label="Address" value={userInfo.address} />
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          <div
            ref={financialSettingsRef}
            className={`section-anchor ${focusedSection === "financial-settings" ? "section-focus-highlight" : ""}`}
          >
            <SectionCard
              eyebrow="Preferences"
              title="Financial settings"
              description="Set the planning values used across the dashboard and alerts."
              icon={Wallet}
            >
              <div className="space-y-3">
                <PreferenceRow
                  label="Currency"
                  description="Display currency for recorded amounts"
                  control={
                    <SelectDropdown
                      value={preferences.currency}
                      options={["PHP", "USD", "EUR", "JPY", "GBP"]}
                      onChange={(value) => handlePreferenceChange("currency", value)}
                    />
                  }
                />
                <PreferenceRow
                  label="Monthly Budget Limit"
                  description="Set the monthly spending cap used for planning"
                  control={
                    <div className="flex items-center gap-2 rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm font-semibold text-[#050725]">
                      <span>P</span>
                      <input
                        type="number"
                        value={preferences.monthlyBudget}
                        onChange={(event) => handlePreferenceChange("monthlyBudget", event.target.value)}
                        className="w-24 bg-transparent text-right outline-none"
                      />
                    </div>
                  }
                />
                <PreferenceRow
                  label="Savings Goal"
                  description="Target percentage of income to set aside"
                  control={
                    <div className="flex items-center gap-2 rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm font-semibold text-[#050725]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={preferences.savingsGoal}
                        onChange={(event) => handlePreferenceChange("savingsGoal", event.target.value)}
                        className="w-16 bg-transparent text-right outline-none"
                      />
                      <span>%</span>
                    </div>
                  }
                />
                <PreferenceRow
                  label="Low Stock Alert Threshold"
                  description="Inventory percentage that should trigger alerts"
                  control={
                    <div className="flex items-center gap-2 rounded-2xl border border-[#2C2F45]/10 bg-white px-4 py-3 text-sm font-semibold text-[#050725]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={preferences.alertThreshold}
                        onChange={(event) => handlePreferenceChange("alertThreshold", event.target.value)}
                        className="w-16 bg-transparent text-right outline-none"
                      />
                      <span>%</span>
                    </div>
                  }
                />
                <PreferenceRow
                  label="Fiscal Year Start"
                  description="Choose the first month of your operating year"
                  control={
                    <SelectDropdown
                      value={preferences.fiscalYearStart}
                      options={[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ]}
                      onChange={(value) => handlePreferenceChange("fiscalYearStart", value)}
                    />
                  }
                />
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="surface-card-soft px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-eyebrow">Key signals</p>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#84848A]">
                Profile
              </span>
            </div>

            <div className="grid gap-3">
              {profileSignals.map((signal) => (
                <button
                  key={signal.label}
                  type="button"
                  onClick={() => focusSection(signal.focusSection)}
                  className={`interactive-surface rounded-[18px] border px-4 py-3 text-left ${
                    signal.tone === "accent"
                      ? "border-[#F9B672]/20 bg-[#F9B672]/12"
                      : signal.tone === "success"
                      ? "border-[#2E6F4E]/12 bg-[#2E6F4E]/8"
                      : "border-[#2C2F45]/8 bg-white/78"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#84848A]">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#050725]">{signal.value}</p>
                </button>
              ))}
            </div>
          </section>

          <SectionCard
            eyebrow="Overview"
            title="Account statistics"
            description="A quick summary of the financial activity connected to this workspace."
            icon={BarChart3}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <StatTile icon={BarChart3} label="Total Transactions" value={accountStats.totalTransactions} />
              <StatTile icon={TrendingUp} label="Total Income" value={accountStats.totalIncome} tone="success" />
              <StatTile icon={TrendingDown} label="Total Expenses" value={accountStats.totalExpenses} tone="danger" />
              <StatTile icon={PiggyBank} label="Inventory Items" value={accountStats.inventoryItems} tone="accent" />
            </div>
          </SectionCard>

          <div
            ref={assistantSecurityRef}
            className={`section-anchor ${focusedSection === "assistant-security" ? "section-focus-highlight" : ""}`}
          >
            <SectionCard
              eyebrow="Workspace"
              title="Assistant and security"
              description={null}
              icon={Shield}
            >
              <div className="space-y-3">
                <CompactRow
                  label="Auto Recommendations"
                  control={<ToggleSwitch enabled={aiSettings.autoRecommendations} onToggle={() => handleAiToggle("autoRecommendations")} />}
                />
                <CompactRow
                  label="Restock Alerts"
                  control={<ToggleSwitch enabled={aiSettings.restockAlerts} onToggle={() => handleAiToggle("restockAlerts")} />}
                />
                <CompactRow
                  label="Budget Warnings"
                  control={<ToggleSwitch enabled={aiSettings.budgetWarnings} onToggle={() => handleAiToggle("budgetWarnings")} />}
                />
                <CompactRow
                  label="Sales Forecasting"
                  control={<ToggleSwitch enabled={aiSettings.salesForecasting} onToggle={() => handleAiToggle("salesForecasting")} />}
                />
                <CompactRow
                  label="Assistant Tone"
                  control={
                    <SelectDropdown
                      value={aiSettings.assistantTone}
                      options={["Professional", "Friendly", "Concise", "Detailed"]}
                      onChange={(value) => handleAiSelectChange("assistantTone", value)}
                    />
                  }
                />
                <CompactRow label="Sign-In Method" value={providerLabel} />
                <CompactRow
                  label="Authentication"
                  value={provider === "google.com" ? "Google managed" : "Password protected"}
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
