import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

function CustomStatusTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const rows = [
    { key: "expensesPaid",    name: "Expenses paid",    color: "#ef4444" },
    { key: "expensesPending", name: "Expenses pending", color: "#94a3b8" },
    { key: "incomePending",   name: "Income pending",   color: "#3b82f6" },
    { key: "incomeReceived",  name: "Income received",  color: "#22c55e" },
  ];

  const getValue = (k) =>
    Math.round((payload.find((p) => p.dataKey === k)?.value ?? 0) * 100);

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #475569",
        color: "#e5e7eb",
        padding: "15px 18px",    
        borderRadius: 12,
        boxShadow: "0 6px 25px rgba(0,0,0,0.45)",
        minWidth: 200,            
        maxWidth: 280,            
        lineHeight: 1.6,            
        fontSize: 15,               
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, color: "#ffffff", fontSize: 16 }}>
        {label}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((r) => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 9,            
                height: 9,
                borderRadius: "50%",
                background: r.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>
              <span style={{ color: "#cbd5e1" }}>{r.name}</span>{" "}
              <span style={{ color: r.color, fontWeight: 600 }}>
                : {getValue(r.key)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatusStackedBar({
  data = [],
  t = (s) => s,
  colors = {
    grid: "#334155",
    text: "#94a3b8",
    income: "#16a34a",
    incomePending: "#3b82f6",
    expense: "#ef4444",
    expensePending: "#94a3b8",
  },
  showIncome = true,
  showExpense = true,
  bg = "#0b1220",
  border = "#334155",
}) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          stackOffset="expand"
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="label" stroke={colors.text} />
          <YAxis
            stroke={colors.text}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip
            cursor={false}
            wrapperStyle={{ zIndex: 10000 }}
            allowEscapeViewBox={{ x: true, y: true }}
            content={<CustomStatusTooltip />}
          />
          <Legend
            formatter={(v) =>
              ({
                expensesPaid: t("dashboard.legend.expensesPaid") ?? "Expenses paid",
                expensesPending:
                  t("dashboard.legend.expensesPending") ?? "Expenses pending",
                incomePending:
                  t("dashboard.legend.incomePending") ?? "Income pending",
                incomeReceived:
                  t("dashboard.legend.incomeReceived") ?? "Income received",
              }[v] || v)
            }
          />
          {showExpense && (
            <>
              <Bar
                dataKey="expensesPaid"
                stackId="exp"
                name="expensesPaid"
                fill={colors.expense}
                isAnimationActive={false}
              />
              <Bar
                dataKey="expensesPending"
                stackId="exp"
                name="expensesPending"
                fill={colors.expensePending}
                isAnimationActive={false}
              />
            </>
          )}
          {showIncome && (
            <>
              <Bar
                dataKey="incomePending"
                stackId="inc"
                name="incomePending"
                fill={colors.incomePending}
                isAnimationActive={false}
              />
              <Bar
                dataKey="incomeReceived"
                stackId="inc"
                name="incomeReceived"
                fill={colors.income}
                isAnimationActive={false}
              />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
