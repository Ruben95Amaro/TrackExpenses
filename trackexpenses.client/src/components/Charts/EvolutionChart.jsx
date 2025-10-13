import React from "react";
import {
  ResponsiveContainer,
  LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line,
} from "recharts";

export default function EvolutionChart({
  data = [],
  incomeKey = "income",
  expenseKey = "expense",
  labelKey = "label",
  currency = "EUR",
  colors = {
    grid: "#475569",
    text: "#94a3b8",
    textStrong: "#e2e8f0", // para ticks
    income: "#16a34a",
    expense: "#ef4444",
  },
  showIncome = true,
  showExpense = true,
  bg = "#0b1220",
  border = "#334155",
  compactTooltip = false, // muda para true se quiseres tooltip abreviado também
}) {
  const fmtCurrency = (v) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(v || 0));

  const fmtCurrencyCompact = (v) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1, // 1.2K, 3.4M
    }).format(Number(v || 0));

  const tickStyle = {
    fill: colors.textStrong || "#e2e8f0",
    fontSize: 14,
    fontWeight: 700,
  };

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 20, bottom: 12, left: 12 }}
        >
          <CartesianGrid strokeDasharray="4 4" stroke={colors.grid || border} />

          <XAxis
            dataKey={labelKey}
            stroke={colors.textStrong || "#e2e8f0"}
            tick={tickStyle}
            tickMargin={10}
            interval="preserveStartEnd"
            axisLine={{ stroke: colors.textStrong || "#e2e8f0", strokeWidth: 1 }}
            tickLine={{ stroke: colors.textStrong || "#e2e8f0", strokeWidth: 1 }}
          />

          <YAxis
            stroke={colors.textStrong || "#e2e8f0"}
            tick={tickStyle}
            tickMargin={10}
            width={68} // espaço para "€1.2K"
            axisLine={{ stroke: colors.textStrong || "#e2e8f0", strokeWidth: 1 }}
            tickLine={{ stroke: colors.textStrong || "#e2e8f0", strokeWidth: 1 }}
            tickFormatter={fmtCurrencyCompact}
            domain={["auto", "auto"]}
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              background: bg,
              borderColor: border,
              borderWidth: 1,
              borderStyle: "solid",
              color: colors.textStrong || "#e2e8f0",
              fontSize: 13,
              fontWeight: 600,
            }}
            labelStyle={{ color: colors.textStrong || "#e2e8f0", fontWeight: 700 }}
            formatter={(v) => (compactTooltip ? fmtCurrencyCompact(v) : fmtCurrency(v))}
          />

          {showIncome && (
            <Line
              type="monotone"
              dataKey={incomeKey}
              stroke={colors.income}
              strokeWidth={3.25}
              dot={false}
              activeDot={{ r: 5 }}
            />
          )}

          {showExpense && (
            <Line
              type="monotone"
              dataKey={expenseKey}
              stroke={colors.expense}
              strokeWidth={3.25}
              dot={false}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
