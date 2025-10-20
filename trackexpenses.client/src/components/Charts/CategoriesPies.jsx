import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

const A = (x) => (Array.isArray(x) ? x : x?.$values ? x.$values : []);
const N = (v) => (v == null ? 0 : Number(v));
const fmtCurrency = (v, cur = "EUR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(N(v));

export default function CategoriesPies({
  incomeData = [],
  expenseData = [],
  currency = "EUR",
  themeColors = {},
}) {
  const { t } = useLanguage(); 

  const { bg = "#0b1220", border = "#334155", text = "#e5e7eb" } = themeColors;

  const goodColors = ["#22c55e", "#0ea5e9", "#14b8a6", "#a855f7", "#4f46e5", "#7c3aed"];
  const badColors  = ["#ef4444", "#f97316", "#eab308", "#06b6d4", "#3b82f6", "#8b5cf6"];

  const titleIncome   = t("charts.categoriesPies.income");
  const titleExpense  = t("charts.categoriesPies.expense");
  const centerIncome  = t("charts.categoriesPies.centerIncome");
  const centerExpense = t("charts.categoriesPies.centerExpense");
  const noDataLabel   = t("charts.categoriesPies.noData");

  const totIncome  = useMemo(() => A(incomeData).reduce((s, d) => s + N(d.amount), 0), [incomeData]);
  const totExpense = useMemo(() => A(expenseData).reduce((s, d) => s + N(d.amount), 0), [expenseData]);

  const Donut = ({ data, colors, centerTitle, total, isGood, title }) => {
    const isEmpty = total <= 0;
    const dataset = isEmpty ? [{ category: noDataLabel, amount: 1 }] : A(data);

    return (
      <div className="flex flex-col items-center w-full">
        <h3
          className="text-lg md:text-xl font-semibold mb-2 text-center"
          style={{ color: text }}
        >
          {title}
        </h3>

        <div className="relative w-full h-[18rem] sm:h-[20rem] md:h-[22rem] lg:h-[24rem]">
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div
              style={{
                color: text,
                opacity: 0.95,
                fontSize: "clamp(12px, 1.8vw, 18px)",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              {centerTitle}
            </div>
            <div
              className="font-semibold mt-1"
              style={{
                color: isGood ? "#22c55e" : "#ef4444",
                fontSize: "clamp(18px, 2.8vw, 28px)",
                lineHeight: 1.1,
              }}
            >
              {fmtCurrency(total, currency)}
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataset}
                dataKey="amount"
                nameKey="category"
                innerRadius="56%"
                outerRadius="82%"
                paddingAngle={isEmpty ? 0 : 2}
                isAnimationActive={false}
              >
                {dataset.map((_, i) => (
                  <Cell
                    key={i}
                    fill={isEmpty ? "rgba(148,163,184,0.58)" : colors[i % colors.length]}
                    stroke={bg}
                  />
                ))}
              </Pie>

              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "#f9fafb",
                  borderColor: border,
                  color: "#111827",
                  padding: "10px 12px",
                  borderRadius: 12,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
                  fontSize: 14,
                }}
                labelStyle={{ fontWeight: 700, marginBottom: 4, color: "#111827" }}
                itemStyle={{ padding: 0 }}
                formatter={(v, name) => [fmtCurrency(v, currency), name]}
              />

              {!isEmpty && (
                <Legend
                  wrapperStyle={{
                    color: text,
                    fontSize: 14,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                  iconType="circle"
                  verticalAlign="bottom"
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
      <Donut
        data={expenseData}
        colors={badColors}
        centerTitle={centerExpense}
        total={totExpense}
        isGood={false}
        title={titleExpense}
      />
      <Donut
        data={incomeData}
        colors={goodColors}
        centerTitle={centerIncome}
        total={totIncome}
        isGood={true}
        title={titleIncome}
      />
    </div>
  );
}
