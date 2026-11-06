"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr } from "@/lib/format";

const BAR = "#818cf8";
const TODAY = "#c7d2fe";

export default function DailyChart({
  data,
  monthShort,
  average,
  todayDay,
}: {
  data: { day: number; amount: number }[];
  monthShort: string;
  /** Daily average (rent and bills excluded). Drawn as a dashed line when above zero. */
  average: number;
  /** Day of the month to highlight, or null when the month shown isn't the current one. */
  todayDay: number | null;
}) {
  // Today is its own stacked series, so it can get a different colour without per-bar cell overrides.
  // The unused side is null (not 0), which keeps it out of the tooltip.
  const rows = useMemo(
    () =>
      data.map((d) => ({
        day: d.day,
        spent: d.day === todayDay ? null : d.amount,
        today: d.day === todayDay ? d.amount : null,
      })),
    [data, todayDay],
  );

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
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
          <Bar dataKey="spent" name="Spent" stackId="day" fill={BAR} radius={[4, 4, 0, 0]} />
          <Bar dataKey="today" name="Spent" stackId="day" fill={TODAY} radius={[4, 4, 0, 0]} />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#a1a1aa"
              strokeDasharray="4 4"
              strokeOpacity={0.85}
              ifOverflow="extendDomain"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
