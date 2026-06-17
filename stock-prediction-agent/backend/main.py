import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agent import run_stock_prediction_agent
from tools import get_stock_data, calculate_technical_indicators

load_dotenv()

app = FastAPI(title="Stock Prediction Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    ticker: str
    period: str = "3mo"


@app.get("/")
def root():
    return {"message": "Stock Prediction Agent API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/predict")
def predict_stock(request: PredictRequest):
    if not request.ticker:
        raise HTTPException(status_code=400, detail="ticker is required")

    ticker = request.ticker.upper().strip()
    valid_periods = ["1mo", "3mo", "6mo", "1y", "2y"]
    if request.period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"period must be one of {valid_periods}")

    result = run_stock_prediction_agent(ticker=ticker, period=request.period)

    if "error" in result and result.get("report") == "分析を完了できませんでした。":
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@app.get("/api/stock/{ticker}")
def get_stock_info(ticker: str, period: str = "3mo"):
    ticker = ticker.upper().strip()
    data = get_stock_data(ticker=ticker, period=period)

    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])

    indicators = calculate_technical_indicators(ticker=ticker, period=period)

    return {
        "stock_data": data,
        "technical_indicators": indicators,
    }
