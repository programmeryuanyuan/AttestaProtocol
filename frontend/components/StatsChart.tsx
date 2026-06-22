"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type Point = { time: string; settled: number }

export default function StatsChart({ data }: { data: Point[] }) {
  if (!data.length) return (
    <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
      No settled tasks yet
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#a855f7" }}
        />
        <Line type="monotone" dataKey="settled" stroke="#a855f7" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
