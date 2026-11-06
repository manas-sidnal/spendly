"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr } from "@/lib/format";

export default function DailyChart({
  data,
  monthShort,
}: {
  data: { day: number; amount: number }[];
  monthShort: string;
}) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#71717a", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={14}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(v) => inr(Number(v))}
            labelFormatter={(d) => `${d} ${monthShort}`}
            contentStyle={{
              background: "#1d1d22",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              fontSize: 13,
              color: "#ececf1",
            }}
            labelStyle={{ color: "#a1a1aa", marginBottom: 2 }}
            itemStyle={{ color: "#ececf1" }}
          />
          <Bar dataKey="amount" name="Spent" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
