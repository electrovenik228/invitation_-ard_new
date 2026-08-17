import html
import json
import logging
import os
from datetime import datetime, timezone
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
DATA_DIR = Path(os.getenv("RSVP_DATA_DIR", ROOT / "data"))
RSVP_FILE = DATA_DIR / "rsvp.jsonl"

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


def save_rsvp(data: RSVPSubmission) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "name": data.name,
        "attendance": data.attendance,
        "guest_count": data.guest_count,
    }
    with RSVP_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(record, ensure_ascii=False) + "\n")


def format_message(data: RSVPSubmission) -> str:
    return (
        "<b>🎉 Жаңы конок / Новая анкета</b>\n\n"
        f"<b>👤 Аты / Имя:</b> {html.escape(data.name)}\n"
        f"<b>✅ Жооп / Ответ:</b> {html.escape(data.attendance)}\n"
        f"<b>👥 Сан / Кол-во:</b> {data.guest_count}"
    )


async def send_telegram_message(message: str) -> bool:
    proxy = TELEGRAM_PROXY or None

    try:
        async with httpx.AsyncClient(timeout=10.0, proxy=proxy) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": message,
                    "parse_mode": "HTML",
                },
            )
    except httpx.RequestError:
        logger.exception("Telegram request failed")
        return False

    if response.status_code != 200:
        logger.error("Telegram API error: %s", response.text)
        return False

    return True


@app.post("/api/rsvp")
async def submit_rsvp(data: RSVPSubmission):
    try:
        save_rsvp(data)
    except OSError as exc:
        logger.exception("Failed to save RSVP locally")
        raise HTTPException(status_code=500, detail="Failed to save RSVP") from exc

    telegram_sent = False
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        message = format_message(data)
        telegram_sent = await send_telegram_message(message)
        if not telegram_sent:
            logger.warning("RSVP saved locally, Telegram delivery failed for %s", data.name)
    else:
        logger.warning("Telegram not configured, RSVP saved locally only")

    return {"ok": True, "telegram": telegram_sent}


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")
