import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json


def get_stock_data(ticker: str, period: str = "3mo") -> dict:
    """Fetch stock OHLCV data from Yahoo Finance."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)

        if hist.empty:
            return {"error": f"No data found for ticker {ticker}"}

        info = stock.info
        hist = hist.reset_index()
        hist["Date"] = hist["Date"].dt.strftime("%Y-%m-%d")

        ohlcv = [
            {
                "date": row["Date"],
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            }
            for _, row in hist.iterrows()
        ]

        latest = ohlcv[-1] if ohlcv else {}
        prev_close = ohlcv[-2]["close"] if len(ohlcv) >= 2 else None
        change_pct = None
        if prev_close and latest:
            change_pct = round((latest["close"] - prev_close) / prev_close * 100, 2)

        return {
            "ticker": ticker,
            "company_name": info.get("longName", ticker),
            "currency": info.get("currency", "USD"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "current_price": latest.get("close"),
            "change_percent": change_pct,
            "ohlcv": ohlcv,
            "period": period,
            "data_points": len(ohlcv),
        }
    except Exception as e:
        return {"error": str(e)}


def calculate_technical_indicators(ticker: str, period: str = "3mo") -> dict:
    """Calculate MA, RSI, MACD technical indicators."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)

        if hist.empty:
            return {"error": f"No data found for ticker {ticker}"}

        close = hist["Close"]

        # Moving Averages
        ma20 = close.rolling(window=20).mean()
        ma50 = close.rolling(window=50).mean()

        # RSI (14-period)
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(window=14).mean()
        loss = (-delta.clip(upper=0)).rolling(window=14).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))

        # MACD (12, 26, 9)
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_histogram = macd_line - signal_line

        # Bollinger Bands (20-period, 2 std)
        bb_mid = close.rolling(window=20).mean()
        bb_std = close.rolling(window=20).std()
        bb_upper = bb_mid + 2 * bb_std
        bb_lower = bb_mid - 2 * bb_std

        dates = hist.index.strftime("%Y-%m-%d").tolist()
        closes = [round(float(v), 2) for v in close.tolist()]

        def safe_list(series):
            return [round(float(v), 2) if not np.isnan(v) else None for v in series.tolist()]

        latest_idx = -1
        current_close = closes[latest_idx]
        current_ma20 = safe_list(ma20)[latest_idx]
        current_ma50 = safe_list(ma50)[latest_idx]
        current_rsi = safe_list(rsi)[latest_idx]
        current_macd = safe_list(macd_line)[latest_idx]
        current_signal = safe_list(signal_line)[latest_idx]
        current_bb_upper = safe_list(bb_upper)[latest_idx]
        current_bb_lower = safe_list(bb_lower)[latest_idx]

        # Signal analysis
        signals = []
        if current_ma20 and current_ma50:
            if current_ma20 > current_ma50:
                signals.append("MA20 > MA50: 上昇トレンド示唆")
            else:
                signals.append("MA20 < MA50: 下降トレンド示唆")

        if current_rsi:
            if current_rsi > 70:
                signals.append(f"RSI {current_rsi:.1f}: 過買い圏（売りシグナル）")
            elif current_rsi < 30:
                signals.append(f"RSI {current_rsi:.1f}: 過売り圏（買いシグナル）")
            else:
                signals.append(f"RSI {current_rsi:.1f}: 中立圏")

        if current_macd and current_signal:
            if current_macd > current_signal:
                signals.append("MACD > Signal: 強気シグナル")
            else:
                signals.append("MACD < Signal: 弱気シグナル")

        if current_bb_upper and current_bb_lower:
            if current_close > current_bb_upper:
                signals.append("価格がボリンジャーバンド上限突破: 過買い注意")
            elif current_close < current_bb_lower:
                signals.append("価格がボリンジャーバンド下限割れ: 過売り注意")

        return {
            "ticker": ticker,
            "dates": dates,
            "closes": closes,
            "ma20": safe_list(ma20),
            "ma50": safe_list(ma50),
            "rsi": safe_list(rsi),
            "macd": safe_list(macd_line),
            "macd_signal": safe_list(signal_line),
            "macd_histogram": safe_list(macd_histogram),
            "bb_upper": safe_list(bb_upper),
            "bb_lower": safe_list(bb_lower),
            "bb_mid": safe_list(bb_mid),
            "current_values": {
                "close": current_close,
                "ma20": current_ma20,
                "ma50": current_ma50,
                "rsi": current_rsi,
                "macd": current_macd,
                "macd_signal": current_signal,
                "bb_upper": current_bb_upper,
                "bb_lower": current_bb_lower,
            },
            "signals": signals,
        }
    except Exception as e:
        return {"error": str(e)}


def get_stock_news(ticker: str) -> dict:
    """Fetch recent news for a stock ticker."""
    try:
        stock = yf.Ticker(ticker)
        news = stock.news

        if not news:
            return {"ticker": ticker, "news": [], "count": 0}

        articles = []
        for item in news[:10]:
            content = item.get("content", {})
            summary = content.get("summary", "")
            title = content.get("title", item.get("title", ""))
            provider = content.get("provider", {})
            provider_name = provider.get("displayName", "") if isinstance(provider, dict) else str(provider)

            pub_date = content.get("pubDate", "")
            if not pub_date:
                pub_time = item.get("providerPublishTime")
                if pub_time:
                    pub_date = datetime.fromtimestamp(pub_time).strftime("%Y-%m-%d %H:%M")

            articles.append({
                "title": title,
                "summary": summary[:300] if summary else "",
                "publisher": provider_name or item.get("publisher", ""),
                "published_at": pub_date,
                "url": content.get("canonicalUrl", {}).get("url", item.get("link", "")) if isinstance(content.get("canonicalUrl"), dict) else item.get("link", ""),
            })

        return {
            "ticker": ticker,
            "news": articles,
            "count": len(articles),
        }
    except Exception as e:
        return {"error": str(e), "ticker": ticker, "news": [], "count": 0}
