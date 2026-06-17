# 株価予測エージェント

Claude AIを活用した株価分析・予測Webアプリケーションです。

## 機能

- **株価データ取得**: Yahoo Financeからリアルタイム株価データ（OHLCV）を取得
- **テクニカル分析**: MA20/MA50、RSI、MACD、ボリンジャーバンドを自動計算
- **ニュース分析**: 最新の関連ニュースを取得・表示
- **AIレポート生成**: Claude claude-opus-4-8が上記データを総合分析し、詳細な予測レポートを生成

## 技術スタック

- **バックエンド**: Python / FastAPI / Anthropic SDK (`claude-opus-4-8`)
- **フロントエンド**: Next.js 15 / TypeScript / Tailwind CSS / Recharts
- **データソース**: Yahoo Finance (yfinance)

## セットアップ

### バックエンド

```bash
cd backend
cp .env.example .env
# .envにANTHROPIC_API_KEYを設定

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 使い方

1. ティッカーシンボルを入力（例: `AAPL`, `TSLA`, `7203.T`）
2. 分析期間を選択（1ヶ月〜2年）
3. 「AI分析」ボタンをクリック
4. Claude AIがデータ収集・分析を行い、予測レポートを生成します

## 注意事項

このツールは情報提供のみを目的としています。投資判断は自己責任で行ってください。
