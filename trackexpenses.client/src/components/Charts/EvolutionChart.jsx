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
  colors = { grid: "#334155", text: "#94a3b8", income: "#16a34a", expense: "#ef4444" },
  showIncome = true,
  showExpense = true,
  bg = "#0b1220",
  border = "#334155",
}) {
  const fmtCurrency = (v) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(v || 0));

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid || border} />
          <XAxis dataKey={labelKey} stroke={colors.text} />
          <YAxis stroke={colors.text} />
          <Tooltip
            contentStyle={{ background: bg, borderColor: border }}
            formatter={(v) => fmtCurrency(v)}
          />
          {showIncome && (
            <Line type="monotone" dataKey={incomeKey} stroke={colors.income} strokeWidth={2} dot={false} />
          )}
          {showExpense && (
            <Line type="monotone" dataKey={expenseKey} stroke={colors.expense} strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
