import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { forecastAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";

function formatCompactCurrency(value) {
  const numericValue = Number(value) || 0;
  if (Math.abs(numericValue) >= 1000) {
    return `P${(numericValue / 1000).toFixed(1)}k`;
  }
  return `P${numericValue.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[160px] rounded-2xl border border-[#2C2F45]/10 bg-[#F4E9DA] px-4 py-3 shadow-[0_16px_35px_rgba(5,7,37,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84848A]">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: P{Number(entry.value).toLocaleString("en-PH")}
          </p>
        ))}
      </div>
    </div>
  );
}

function AnalyticsChart() {
  const [chartData, setChartData] = useState([]);
  const [splitLabel, setSplitLabel] = useState(null);
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    forecastAPI
      .getForecast()
      .then((data) => {
        const recentSales = data.recent_sales ?? [];
        const forecastSales = data.forecast ?? [];

        const actualPoints = recentSales.map((value, index) => ({
          label: `D${index + 1}`,
          actual: Math.round(value),
          forecast: null,
        }));

        const projectedPoints = forecastSales.map((value, index) => ({
          label: `+${index + 1}d`,
          actual: null,
          forecast: Math.round(value),
        }));

        if (actualPoints.length > 0 && projectedPoints.length > 0) {
          projectedPoints[0] = {
            ...projectedPoints[0],
            actual: actualPoints[actualPoints.length - 1].actual,
          };
        }

        setChartData([...actualPoints, ...projectedPoints]);
        setSplitLabel(projectedPoints[0]?.label ?? null);
        setModelName(data.model ?? "Forecast");
        setLoading(false);
      })
      .catch(() => {
        setError("We could not load the sales forecast right now.");
        setLoading(false);
      });
  }, []);

  return (
    <section className="surface-panel surface-panel-pad">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">Sales analytics</p>
          <h3 className="section-subtitle">Performance and 7-day forecast</h3>
          <p className="section-copy">
            Review recent sales movement and the projected trend line generated from your latest data.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#2C2F45]/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2C2F45]">
          Model
          <span className="rounded-full bg-[#2C2F45] px-2.5 py-1 text-[10px] text-white">{modelName || "Forecast"}</span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading forecast" />
      ) : error ? (
        <div className="mt-8 rounded-[22px] border border-red-200 bg-red-50/80 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-8 h-[280px] w-full sm:h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7C8B1" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#84848A" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: "#84848A" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactCurrency}
                />

                <Tooltip content={<CustomTooltip />} />

                {splitLabel && (
                  <ReferenceLine
                    x={splitLabel}
                    stroke="#B6A48A"
                    strokeDasharray="4 4"
                    label={{
                      value: "Forecast",
                      fill: "#84848A",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#2E6F4E"
                  strokeWidth={3}
                  dot={{ r: 2.5, fill: "#2E6F4E" }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  name={modelName || "Forecast"}
                  stroke="#F9B672"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: "#F9B672" }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-[#2C2F45]/8 pt-4 text-xs text-[#6F6F76]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-8 rounded-full bg-[#2E6F4E]" />
              Actual sales
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-8 rounded-full border border-dashed border-[#F9B672] bg-[#F9B672]/50" />
              {modelName || "Forecast"} projection
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default AnalyticsChart;
