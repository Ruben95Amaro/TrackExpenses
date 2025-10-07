import React from "react";
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar,
} from "recharts";

export default function WalletBalancesBar({
  data = [],
  currency = "EUR",
  colors = { grid: "#334155", text: "#94a3b8", bar: "#3b82f6" },
  bg = "#0b1220",
  border = "#334155",
}) {
  const fmt = (v) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(v||0));

  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid || border} />
          <XAxis type="number" stroke={colors.text} tickFormatter={fmt} />
          <YAxis type="category" dataKey="walletName" stroke={colors.text} width={120} />
          <Tooltip contentStyle={{ background: bg, borderColor: border }} formatter={(v) => fmt(v)} />
          <Bar dataKey="balance" fill={colors.bar} radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
