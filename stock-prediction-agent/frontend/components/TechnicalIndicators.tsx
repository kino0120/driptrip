"use client";

interface TechnicalData {
  current_values: {
    close: number;
    ma20: number | null;
    ma50: number | null;
    rsi: number | null;
    macd: number | null;
    macd_signal: number | null;
    bb_upper: number | null;
    bb_lower: number | null;
  };
  signals: string[];
}

interface TechnicalIndicatorsProps {
  technicalData: TechnicalData;
}

function RSIGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct > 70 ? "#ef4444" : pct < 30 ? "#22c55e" : "#f59e0b";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>過売り(30)</span>
        <span className="font-bold text-white text-sm" style={{ color }}>
          {value.toFixed(1)}
        </span>
        <span>過買い(70)</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  suffix = "",
  colorClass = "text-white",
}: {
  label: string;
  value: number | null;
  suffix?: string;
  colorClass?: string;
}) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {suffix}
      </span>
    </div>
  );
}

export default function TechnicalIndicators({ technicalData }: TechnicalIndicatorsProps) {
  const cv = technicalData.current_values;
  const { signals } = technicalData;

  const macdColor =
    cv.macd !== null && cv.macd_signal !== null
      ? cv.macd > cv.macd_signal
        ? "text-green-400"
        : "text-red-400"
      : "text-white";

  const trendColor =
    cv.ma20 !== null && cv.ma50 !== null
      ? cv.ma20 > cv.ma50
        ? "text-green-400"
        : "text-red-400"
      : "text-white";

  return (
    <div className="card space-y-5">
      <h3 className="font-semibold text-slate-200">テクニカル指標</h3>

      {/* RSI Gauge */}
      {cv.rsi !== null && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">RSI (14)</p>
          <RSIGauge value={cv.rsi} />
        </div>
      )}

      {/* Indicators */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">移動平均線</p>
        <IndicatorRow label="MA20" value={cv.ma20} colorClass={trendColor} />
        <IndicatorRow label="MA50" value={cv.ma50} />
        <IndicatorRow label="現在値" value={cv.close} colorClass="text-sky-400" />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">MACD</p>
        <IndicatorRow label="MACD" value={cv.macd} colorClass={macdColor} />
        <IndicatorRow label="シグナル" value={cv.macd_signal} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">ボリンジャーバンド</p>
        <IndicatorRow label="上限" value={cv.bb_upper} colorClass="text-red-400" />
        <IndicatorRow label="下限" value={cv.bb_lower} colorClass="text-green-400" />
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">シグナル分析</p>
          <ul className="space-y-1">
            {signals.map((signal, i) => {
              const isPositive = signal.includes("上昇") || signal.includes("強気") || signal.includes("買い") || signal.includes("下限割れ");
              const isNegative = signal.includes("下降") || signal.includes("弱気") || signal.includes("売り") || signal.includes("上限突破");
              return (
                <li
                  key={i}
                  className={`text-xs px-3 py-2 rounded-lg ${
                    isPositive
                      ? "bg-green-500/10 text-green-400"
                      : isNegative
                      ? "bg-red-500/10 text-red-400"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                >
                  {signal}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
