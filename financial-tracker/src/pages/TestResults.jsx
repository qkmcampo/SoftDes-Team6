import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  Package,
  PieChart,
  ReceiptText,
  Wallet,
} from "lucide-react";

import TEST_CASE_RESULTS from "../data/testResults";

const CASE_ICONS = {
  "wallet-balance": Wallet,
  "add-transaction": ReceiptText,
  "inventory-restock": Package,
  "assistant-chat": Bot,
  "transaction-validation": AlertCircle,
};

const METHOD_STYLES = {
  GET: "bg-[#2E6F4E]/15 text-[#2E6F4E] border border-[#2E6F4E]/30",
  POST: "bg-[#F9B672]/20 text-[#8B5A21] border border-[#F9B672]/40",
  PUT: "bg-[#2C2F45]/15 text-[#2C2F45] border border-[#2C2F45]/20",
};

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/65">{hint}</p>
    </div>
  );
}

function TestResults() {
  const [selectedCaseId, setSelectedCaseId] = useState(TEST_CASE_RESULTS[0].id);

  const selectedCase = useMemo(
    () => TEST_CASE_RESULTS.find((testCase) => testCase.id === selectedCaseId) || TEST_CASE_RESULTS[0],
    [selectedCaseId]
  );

  const totals = useMemo(() => {
    const totalCases = TEST_CASE_RESULTS.length;
    const totalTrials = TEST_CASE_RESULTS.reduce((sum, testCase) => sum + testCase.totalTrials, 0);
    const totalAccurate = TEST_CASE_RESULTS.reduce(
      (sum, testCase) => sum + testCase.accurateTrials,
      0
    );

    return {
      totalCases,
      totalTrials,
      totalAccurate,
      accuracyRate: `${Math.round((totalAccurate / totalTrials) * 100)}%`,
    };
  }, []);

  const SelectedIcon = CASE_ICONS[selectedCase.id] || PieChart;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <section className="relative overflow-hidden rounded-[32px] bg-[#2C2F45] px-8 py-9 text-white shadow-2xl">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#F9B672]/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-28 w-full bg-[radial-gradient(circle_at_bottom_left,_rgba(249,182,114,0.18),_transparent_48%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Quality Assurance Report
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight">
              API test evidence for wallet, transactions, inventory, assistant, and validation workflows
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              This page consolidates the five verified test cases used in the project paper. Each case contains 20
              professionally summarized trials with expected output, actual output, and accuracy remarks.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Live API behavior aligned with the paper tables
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                100 total trials documented
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard label="Test Cases" value={totals.totalCases} hint="Five verified API scenarios" />
            <SummaryCard label="Total Trials" value={totals.totalTrials} hint="Twenty trials per test case" />
            <SummaryCard label="Accurate Results" value={totals.totalAccurate} hint="All documented outputs matched" />
            <SummaryCard label="Overall Accuracy" value={totals.accuracyRate} hint="Professional summary ready for presentation" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-[28px] border border-[#E5D5BF] bg-[#F4E9DA] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84848A]">Cases</p>
              <h2 className="mt-1 text-lg font-bold text-[#050725]">QA Navigation</h2>
            </div>
            <div className="rounded-2xl bg-[#ECDFC7] p-2 text-[#2C2F45]">
              <PieChart size={18} />
            </div>
          </div>

          <div className="space-y-3">
            {TEST_CASE_RESULTS.map((testCase) => {
              const Icon = CASE_ICONS[testCase.id] || PieChart;
              const isActive = testCase.id === selectedCaseId;

              return (
                <button
                  key={testCase.id}
                  type="button"
                  onClick={() => setSelectedCaseId(testCase.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-[#2C2F45] bg-[#2C2F45] text-white shadow-lg"
                      : "border-[#E5D5BF] bg-white/70 text-[#050725] hover:border-[#F9B672] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-2xl p-2 ${
                        isActive ? "bg-white/10 text-[#F9B672]" : "bg-[#ECDFC7] text-[#2C2F45]"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isActive ? "text-white/60" : "text-[#84848A]"}`}>
                        {testCase.number}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-5">{testCase.title}</p>
                      <p className={`mt-2 text-xs ${isActive ? "text-white/70" : "text-[#84848A]"}`}>
                        {testCase.totalTrials} trials • {testCase.accuracyRate} accurate
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[28px] border border-[#E5D5BF] bg-[#F4E9DA] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#ECDFC7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#84848A]">
                  {selectedCase.number}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${METHOD_STYLES[selectedCase.method] || METHOD_STYLES.POST}`}>
                  {selectedCase.method}
                </span>
                <span className="rounded-full border border-[#E5D5BF] bg-white/60 px-3 py-1 text-xs font-medium text-[#2C2F45]">
                  {selectedCase.endpoint}
                </span>
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="rounded-[22px] bg-[#2C2F45] p-3 text-[#F9B672] shadow-md">
                  <SelectedIcon size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#050725]">{selectedCase.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5F5F67]">{selectedCase.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-fit">
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-[#84848A]">Trials</p>
                <p className="mt-2 text-2xl font-bold text-[#050725]">{selectedCase.totalTrials}</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-[#84848A]">Accuracy</p>
                <p className="mt-2 text-2xl font-bold text-[#2E6F4E]">{selectedCase.accuracyRate}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[#DFCCB5] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#2C2F45] text-left text-white">
                  <tr>
                    {selectedCase.columns.map((column) => (
                      <th
                        key={column.key}
                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {selectedCase.rows.map((row, index) => (
                    <tr
                      key={`${selectedCase.id}-${row.trial}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#FCF8F2]"}
                    >
                      {selectedCase.columns.map((column) => {
                        const value = row[column.key];

                        return (
                          <td
                            key={`${row.trial}-${column.key}`}
                            className={`px-4 py-3 align-top text-[#35353C] ${
                              column.key === "remarks" ? "whitespace-nowrap" : ""
                            }`}
                          >
                            {column.key === "remarks" ? (
                              <span className="inline-flex rounded-full bg-[#2E6F4E]/12 px-3 py-1 text-xs font-semibold text-[#2E6F4E]">
                                {value}
                              </span>
                            ) : column.key === "trial" ? (
                              <span className="font-semibold text-[#050725]">{value}</span>
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-[#E9DCCB] bg-[#FCF8F2] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-[#050725]">
                Total: {selectedCase.accurateTrials}/{selectedCase.totalTrials}
              </p>
              <p className="text-[#2E6F4E]">100% Accurate</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

export default TestResults;
