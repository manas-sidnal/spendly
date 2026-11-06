"use client";

import type { CSSProperties } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColor } from "@/lib/constants";
import { inr, inrCompact } from "@/lib/format";

export default function CategoryBreakdown({
  data,
  total,
  loading = false,
}: {
  data: { name: string; value: number }[];
  total: number;
  loading?: boolean;
}) {
  if (loading && data.length === 0) {
    return (
      <div className="breakdown" role="status" aria-label="Loading spending by category">
        <div className="donut">
          <div className="skeleton-ring" />
        </div>
        <div className="legend">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty">
        <strong>Nothing to show yet</strong>
        <span>Your spending by category will appear here.</span>
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, fill: categoryColor(d.name) }));

  return (
    <div className="breakdown">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            />
            <Tooltip
              formatter={(v) => inr(Number(v))}
              contentStyle={{
                background: "#1d1d22",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                fontSize: 13,
                color: "#ececf1",
              }}
              itemStyle={{ color: "#ececf1" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <span>Total</span>
          <strong>{inrCompact(total)}</strong>
        </div>
      </div>

      <ul className="legend">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const color = categoryColor(d.name);
          return (
            <li key={d.name} style={{ "--dot": color } as CSSProperties}>
              <span className="dot" />
              <span className="name">{d.name}</span>
              <span className="pct">{pct.toFixed(0)}%</span>
              <span className="val">{inr(d.value)}</span>
              <span className="bar">
                <i style={{ width: `${pct}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
