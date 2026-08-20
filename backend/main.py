import html
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
TELEGRAM_PROXY = os.getenv("TELEGRAM_PROXY")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
DATA_DIR = Path(os.getenv("RSVP_DATA_DIR", ROOT / "data"))
RSVP_FILE = DATA_DIR / "rsvp.jsonl"

NOT_ATTENDING_MARKERS = (
    "келе албайм",
    "не смогу",
    "не смогу присутствовать",
)

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


def load_rsvps() -> list[dict]:
    if not RSVP_FILE.exists():
        return []

    records = []
    for line in RSVP_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            logger.warning("Skipping invalid RSVP record: %s", line)
    records.sort(key=lambda item: item.get("timestamp", ""), reverse=True)
    return records


def is_attending(attendance: str) -> bool:
    normalized = attendance.casefold()
    return not any(marker in normalized for marker in NOT_ATTENDING_MARKERS)


def verify_admin(x_admin_password: str | None = Header(default=None)) -> None:
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin access is not configured")
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")


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


@app.get("/api/guests")
async def list_guests(_: None = Depends(verify_admin)):
    records = load_rsvps()

    attending = [record for record in records if is_attending(record.get("attendance", ""))]
    not_attending = [record for record in records if not is_attending(record.get("attendance", ""))]

    return {
        "total": len(records),
        "attending_count": len(attending),
        "not_attending_count": len(not_attending),
        "total_guests": sum(record.get("guest_count", 1) for record in attending),
        "guests": records,
    }


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")
