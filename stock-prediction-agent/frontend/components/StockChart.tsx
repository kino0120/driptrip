"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TechnicalData {
  dates: string[];
  closes: number[];
  ma20: (number | null)[];
  ma50: (number | null)[];
  rsi: (number | null)[];
  macd: (number | null)[];
  macd_signal: (number | null)[];
  macd_histogram: (number | null)[];
  bb_upper: (number | null)[];
  bb_lower: (number | null)[];
  bb_mid: (number | null)[];
}

interface StockChartProps {
  ticker: string;
  technicalData: TechnicalData;
}

type ChartView = "price" | "rsi" | "macd";

export default function StockChart({ ticker, technicalData }: StockChartProps) {
  const [activeView, setActiveView] = useState<ChartView>("price");

  const priceData = technicalData.dates.map((date, i) => ({
    date: date.slice(5),
    close: technicalData.closes[i],
    ma20: technicalData.ma20[i],
    ma50: technicalData.ma50[i],
    bb_upper: technicalData.bb_upper[i],
    bb_lower: technicalData.bb_lower[i],
  }));

  const rsiData = technicalData.dates.map((date, i) => ({
    date: date.slice(5),
    rsi: technicalData.rsi[i],
  }));

  const macdData = technicalData.dates.map((date, i) => ({
    date: date.slice(5),
    macd: technicalData.macd[i],
    signal: technicalData.macd_signal[i],
    histogram: technicalData.macd_histogram[i],
  }));

  // Thin out data for readability
  const thinFactor = Math.max(1, Math.floor(priceData.length / 60));
  const filteredPrice = priceData.filter((_, i) => i % thinFactor === 0 || i === priceData.length - 1);
  const filteredRsi = rsiData.filter((_, i) => i % thinFactor === 0 || i === rsiData.length - 1);
  const filteredMacd = macdData.filter((_, i) => i % thinFactor === 0 || i === macdData.length - 1);

  const views: { key: ChartView; label: string }[] = [
    { key: "price", label: "株価チャート" },
    { key: "rsi", label: "RSI" },
    { key: "macd", label: "MACD" },
  ];

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">{ticker} チャート</h3>
        <div className="flex gap-1">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                activeView === v.key
                  ? "bg-sky-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === "price" && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={filteredPrice}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Line type="monotone" dataKey="close" stroke="#38bdf8" dot={false} strokeWidth={2} name="終値" />
            <Line type="monotone" dataKey="ma20" stroke="#a78bfa" dot={false} strokeWidth={1.5} name="MA20" />
            <Line type="monotone" dataKey="ma50" stroke="#fb923c" dot={false} strokeWidth={1.5} name="MA50" />
            <Line type="monotone" dataKey="bb_upper" stroke="#64748b" dot={false} strokeDasharray="4 4" strokeWidth={1} name="BB上限" />
            <Line type="monotone" dataKey="bb_lower" stroke="#64748b" dot={false} strokeDasharray="4 4" strokeWidth={1} name="BB下限" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {activeView === "rsi" && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={filteredRsi}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Line type="monotone" dataKey="rsi" stroke="#22d3ee" dot={false} strokeWidth={2} name="RSI" />
            {/* Overbought/Oversold reference lines drawn via custom */}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {activeView === "macd" && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={filteredMacd}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Bar
              dataKey="histogram"
              fill="#475569"
              name="ヒストグラム"
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="macd" stroke="#38bdf8" dot={false} strokeWidth={2} name="MACD" />
            <Line type="monotone" dataKey="signal" stroke="#f97316" dot={false} strokeWidth={2} name="シグナル" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
