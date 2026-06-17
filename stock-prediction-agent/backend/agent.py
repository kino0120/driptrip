import json
import anthropic
from tools import get_stock_data, calculate_technical_indicators, get_stock_news

client = anthropic.Anthropic()

TOOLS = [
    {
        "name": "get_stock_data",
        "description": "指定した株式ティッカーの株価データ（OHLCV）、企業情報、時価総額、PERなどを取得します。",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "株式ティッカーシンボル（例: AAPL, 7203.T, TSLA）",
                },
                "period": {
                    "type": "string",
                    "description": "データ取得期間。'1mo', '3mo', '6mo', '1y', '2y'のいずれか",
                    "enum": ["1mo", "3mo", "6mo", "1y", "2y"],
                },
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "calculate_technical_indicators",
        "description": "株式のテクニカル指標（MA20、MA50、RSI、MACD、ボリンジャーバンド）を計算します。",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "株式ティッカーシンボル",
                },
                "period": {
                    "type": "string",
                    "description": "データ取得期間",
                    "enum": ["1mo", "3mo", "6mo", "1y", "2y"],
                },
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "get_stock_news",
        "description": "株式に関連する最新ニュースを取得します。",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "株式ティッカーシンボル",
                },
            },
            "required": ["ticker"],
        },
    },
]

SYSTEM_PROMPT = """あなたは優秀な株式アナリストAIです。
ユーザーが指定した銘柄について、以下のツールを使って包括的な分析と予測レポートを作成してください。

分析の手順：
1. get_stock_data でOHLCVデータと企業基本情報を取得
2. calculate_technical_indicators でMA、RSI、MACDなどを計算
3. get_stock_news で最新ニュースを取得
4. 上記のデータを総合的に分析して、詳細な予測レポートを作成

レポートには以下を含めること：
- 現在の株価状況サマリー
- テクニカル分析の詳細（トレンド、支持線・抵抗線、オシレーター）
- ニュース・センチメント分析
- 短期（1週間）・中期（1ヶ月）の価格予測
- リスク要因と注意点
- 投資判断（強気/中立/弱気）とその根拠

注意: 投資は自己責任であることを必ず明記してください。"""


def process_tool_call(tool_name: str, tool_input: dict) -> str:
    if tool_name == "get_stock_data":
        result = get_stock_data(
            ticker=tool_input["ticker"],
            period=tool_input.get("period", "3mo"),
        )
    elif tool_name == "calculate_technical_indicators":
        result = calculate_technical_indicators(
            ticker=tool_input["ticker"],
            period=tool_input.get("period", "3mo"),
        )
    elif tool_name == "get_stock_news":
        result = get_stock_news(ticker=tool_input["ticker"])
    else:
        result = {"error": f"Unknown tool: {tool_name}"}

    return json.dumps(result, ensure_ascii=False, default=str)


def run_stock_prediction_agent(ticker: str, period: str = "3mo") -> dict:
    """Run the stock prediction agent for a given ticker."""
    messages = [
        {
            "role": "user",
            "content": f"銘柄 {ticker} について、{period}のデータを使って詳細な株価分析と予測レポートを作成してください。",
        }
    ]

    collected_data = {
        "stock_data": None,
        "technical_indicators": None,
        "news": None,
    }

    while True:
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=8192,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_result = process_tool_call(block.name, block.input)

                    # Store the raw data for frontend use
                    result_data = json.loads(tool_result)
                    if block.name == "get_stock_data":
                        collected_data["stock_data"] = result_data
                    elif block.name == "calculate_technical_indicators":
                        collected_data["technical_indicators"] = result_data
                    elif block.name == "get_stock_news":
                        collected_data["news"] = result_data

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": tool_result,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        elif response.stop_reason == "end_turn":
            report_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    report_text += block.text

            return {
                "ticker": ticker,
                "report": report_text,
                "stock_data": collected_data["stock_data"],
                "technical_indicators": collected_data["technical_indicators"],
                "news": collected_data["news"],
            }
        else:
            return {
                "ticker": ticker,
                "report": "分析を完了できませんでした。",
                "error": f"Unexpected stop reason: {response.stop_reason}",
                "stock_data": collected_data["stock_data"],
                "technical_indicators": collected_data["technical_indicators"],
                "news": collected_data["news"],
            }
