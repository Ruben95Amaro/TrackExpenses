import React from "react";
import {
  ResponsiveContainer,
  LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line,
} from "recharts";

function parseToRGB(c) {
  if (!c) return { r: 11, g: 18, b: 32 };
  if (c.startsWith("#")) {
    const h = c.replace("#", "");
    const full = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
  }
  if (c.startsWith("rgb")) {
    const nums = c.replace(/[^\d.,]/g, "").split(",").map(Number);
    return { r: nums[0] ?? 11, g: nums[1] ?? 18, b: nums[2] ?? 32 };
  }
  return { r: 11, g: 18, b: 32 };
}
function isDarkColor(color) {
  const { r, g, b } = parseToRGB(color);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

export default function EvolutionChart({
  data = [],
  incomeKey = "income",
  expenseKey = "expense",
  labelKey = "label",
  currency = "EUR",
  colors = {
    grid: "#475569",
    text: "#94a3b8",
    textStrong: undefined,
    income: "#16a34a",
    expense: "#ef4444",
  },
  showIncome = true,
  showExpense = true,
  bg = "#0b1220",
  border = "#334155",
  compactTooltip = false,
}) {
  const dark = isDarkColor(bg);
  const autoText = dark ? "#FFFFFF" : "#000000";
  const TEXT = colors?.textStrong || autoText;

  const BORDER = dark ? "#FFFFFF" : "#000000";

  const GRID = colors?.grid ?? (dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)");

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
      maximumFractionDigits: 1,
    }).format(Number(v || 0));

  const tickStyle = { fill: TEXT, fontSize: 14, fontWeight: 700 };

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 12, left: 12 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={GRID || border} />

          <XAxis
            dataKey={labelKey}
            stroke={TEXT}
            tick={tickStyle}
            tickMargin={10}
            interval="preserveStartEnd"
            axisLine={{ stroke: BORDER, strokeWidth: 1 }}
            tickLine={{ stroke: BORDER, strokeWidth: 1 }}
          />

          <YAxis
            stroke={TEXT}
            tick={tickStyle}
            tickMargin={10}
            width={68}
            axisLine={{ stroke: BORDER, strokeWidth: 1 }}
            tickLine={{ stroke: BORDER, strokeWidth: 1 }}
            tickFormatter={fmtCurrencyCompact}
            domain={["auto", "auto"]}
            allowDecimals={false}
          />

          <Tooltip
            contentStyle={{
              background: bg,
              borderColor: BORDER, 
              borderWidth: 1,
              borderStyle: "solid",
              color: TEXT,
              fontSize: 13,
              fontWeight: 600,
            }}
            labelStyle={{ color: TEXT, fontWeight: 700 }}
            itemStyle={{ color: TEXT, fontWeight: 600 }}
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
