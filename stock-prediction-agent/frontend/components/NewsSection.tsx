"use client";

import { ExternalLink, Newspaper } from "lucide-react";

interface NewsArticle {
  title: string;
  summary: string;
  publisher: string;
  published_at: string;
  url: string;
}

interface NewsSectionProps {
  newsData: {
    news: NewsArticle[];
    count: number;
  };
}

export default function NewsSection({ newsData }: NewsSectionProps) {
  const { news } = newsData;

  if (!news || news.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
        <Newspaper size={40} />
        <p>ニュースが見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">最新ニュース</h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
          {news.length}件
        </span>
      </div>

      <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {news.map((article, i) => (
          <li key={i} className="bg-slate-700/40 rounded-lg p-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-200 hover:text-sky-400 transition-colors line-clamp-2 flex items-start gap-1"
                  >
                    {article.title}
                    <ExternalLink size={12} className="flex-shrink-0 mt-0.5 opacity-60" />
                  </a>
                ) : (
                  <p className="text-sm font-medium text-slate-200 line-clamp-2">{article.title}</p>
                )}
              </div>
            </div>

            {article.summary && (
              <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {article.publisher && <span>{article.publisher}</span>}
              {article.publisher && article.published_at && <span>·</span>}
              {article.published_at && <span>{article.published_at}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
