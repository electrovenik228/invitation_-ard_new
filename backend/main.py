import html
import logging
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
TELEGRAM_PROXY = os.getenv("TELEGRAM_PROXY")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Kyz Uzatuu RSVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RSVPSubmission(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    attendance: str = Field(min_length=1, max_length=200)
    guest_count: int = Field(ge=1, le=50)


def format_message(data: RSVPSubmission) -> str:
    return (
        "<b>🎉 Жаңы конок / Новая анкета</b>\n\n"
        f"<b>👤 Аты / Имя:</b> {html.escape(data.name)}\n"
        f"<b>✅ Жооп / Ответ:</b> {html.escape(data.attendance)}\n"
        f"<b>👥 Сан / Кол-во:</b> {data.guest_count}"
    )


async def send_telegram_message(message: str) -> None:
    proxy = TELEGRAM_PROXY or None

    try:
        async with httpx.AsyncClient(timeout=15.0, proxy=proxy) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": message,
                    "parse_mode": "HTML",
                },
            )
    except httpx.RequestError as exc:
        logger.error("Telegram request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Telegram unreachable") from exc

    if response.status_code != 200:
        logger.error("Telegram API error: %s", response.text)
        raise HTTPException(status_code=502, detail="Failed to send to Telegram")


@app.post("/api/rsvp")
async def submit_rsvp(data: RSVPSubmission):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        raise HTTPException(status_code=500, detail="Telegram not configured")

    message = format_message(data)
    await send_telegram_message(message)

    return {"ok": True}


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")
