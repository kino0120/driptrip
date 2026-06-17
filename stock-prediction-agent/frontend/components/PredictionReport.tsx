"use client";

import { useState } from "react";
import { FileText, Copy, Check } from "lucide-react";

interface PredictionReportProps {
  report: string;
  ticker: string;
}

export default function PredictionReport({ report, ticker }: PredictionReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderReport = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2">
            {line.slice(2)}
          </h2>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-lg font-semibold text-sky-400 mt-4 mb-2">
            {line.slice(3)}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-base font-semibold text-slate-300 mt-3 mb-1">
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-semibold text-slate-200 mt-2">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-slate-300 ml-4 list-disc">
            <ReportInlineMarkdown text={line.slice(2)} />
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-slate-300 leading-relaxed">
          <ReportInlineMarkdown text={line} />
        </p>
      );
    });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-sky-400" />
          <h3 className="font-semibold text-slate-200">AI予測レポート</h3>
          <span className="text-xs text-slate-500">({ticker})</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" />
              コピー済み
            </>
          ) : (
            <>
              <Copy size={13} />
              コピー
            </>
          )}
        </button>
      </div>

      <div className="prose prose-invert max-w-none max-h-[600px] overflow-y-auto space-y-1 pr-2">
        {report ? (
          renderReport(report)
        ) : (
          <p className="text-slate-500">レポートを生成中...</p>
        )}
      </div>
    </div>
  );
}

function ReportInlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
