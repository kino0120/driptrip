"use client";

import { useState } from "react";
import { Search, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import StockChart from "@/components/StockChart";
import TechnicalIndicators from "@/components/TechnicalIndicators";
import NewsSection from "@/components/NewsSection";
import PredictionReport from "@/components/PredictionReport";

interface StockData {
  ticker: string;
  company_name: string;
  currency: string;
  current_price: number;
  change_percent: number;
  market_cap: number;
  pe_ratio: number;
  "52w_high": number;
  "52w_low": number;
  ohlcv: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

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

interface NewsArticle {
  title: string;
  summary: string;
  publisher: string;
  published_at: string;
  url: string;
}

interface PredictionResult {
  ticker: string;
  report: string;
  stock_data: StockData | null;
  technical_indicators: TechnicalData | null;
  news: { news: NewsArticle[]; count: number } | null;
}

const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "7203.T", name: "トヨタ" },
  { symbol: "9984.T", name: "ソフトバンクG" },
];

const PERIODS = [
  { value: "1mo", label: "1ヶ月" },
  { value: "3mo", label: "3ヶ月" },
  { value: "6mo", label: "6ヶ月" },
  { value: "1y", label: "1年" },
  { value: "2y", label: "2年" },
];

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [period, setPeriod] = useState("3mo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = async (tickerSymbol?: string) => {
    const targetTicker = tickerSymbol || ticker;
    if (!targetTicker.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: targetTicker.trim().toUpperCase(), period }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "分析に失敗しました");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePredict();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <TrendingUp className="text-sky-400" size={28} />
          <h1 className="text-xl font-bold text-white">株価予測エージェント</h1>
          <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
            Powered by Claude AI
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">銘柄を分析する</h2>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ティッカーシンボル（例: AAPL, 7203.T）"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => handlePredict()}
              disabled={loading || !ticker.trim()}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  AI分析
                </>
              )}
            </button>
          </div>

          {/* Popular tickers */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-400">人気銘柄:</span>
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  setTicker(t.symbol);
                  handlePredict(t.symbol);
                }}
                disabled={loading}
                className="text-sm bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 px-3 py-1 rounded-full transition-colors"
              >
                {t.symbol} <span className="text-slate-500">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={48} className="animate-spin text-sky-400" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-slate-200">Claude AIが分析中...</p>
              <p className="text-sm text-slate-400">
                株価データ取得 → テクニカル分析 → ニュース収集 → レポート生成
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Stock Header */}
            {result.stock_data && (
              <div className="card">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{result.ticker}</h2>
                      <span className="text-slate-400">{result.stock_data.company_name}</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-4xl font-bold text-white">
                        {result.stock_data.current_price?.toLocaleString()}
                        <span className="text-lg text-slate-400 ml-1">{result.stock_data.currency}</span>
                      </span>
                      {result.stock_data.change_percent !== null && (
                        <span
                          className={`text-lg font-medium ${
                            result.stock_data.change_percent >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {result.stock_data.change_percent >= 0 ? "+" : ""}
                          {result.stock_data.change_percent}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.stock_data.market_cap && (
                      <div>
                        <p className="text-slate-400">時価総額</p>
                        <p className="text-white font-medium">
                          {(result.stock_data.market_cap / 1e9).toFixed(1)}B {result.stock_data.currency}
                        </p>
                      </div>
                    )}
                    {result.stock_data.pe_ratio && (
                      <div>
                        <p className="text-slate-400">PER</p>
                        <p className="text-white font-medium">{result.stock_data.pe_ratio?.toFixed(1)}</p>
                      </div>
                    )}
                    {result.stock_data["52w_high"] && (
                      <div>
                        <p className="text-slate-400">52週高値</p>
                        <p className="text-green-400 font-medium">{result.stock_data["52w_high"]?.toLocaleString()}</p>
                      </div>
                    )}
                    {result.stock_data["52w_low"] && (
                      <div>
                        <p className="text-slate-400">52週安値</p>
                        <p className="text-red-400 font-medium">{result.stock_data["52w_low"]?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Charts and Indicators */}
            {result.technical_indicators && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <StockChart
                    ticker={result.ticker}
                    technicalData={result.technical_indicators}
                  />
                </div>
                <div>
                  <TechnicalIndicators technicalData={result.technical_indicators} />
                </div>
              </div>
            )}

            {/* News and Report */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {result.news && <NewsSection newsData={result.news} />}
              <PredictionReport report={result.report} ticker={result.ticker} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
            <TrendingUp size={64} className="text-slate-600" />
            <div>
              <p className="text-xl font-medium text-slate-400">銘柄を入力してAI分析を開始</p>
              <p className="text-sm text-slate-500 mt-2">
                Claude AIがテクニカル分析、ニュース分析を行い予測レポートを生成します
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-700 mt-16 py-6 text-center text-xs text-slate-500">
        <p>※ このツールは情報提供のみを目的としています。投資判断は自己責任で行ってください。</p>
      </footer>
    </div>
  );
}
