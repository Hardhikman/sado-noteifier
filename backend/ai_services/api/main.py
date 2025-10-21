# backend/ai_services/api/main.py

import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

# Local imports
from .models import AuthSignUp, AuthSignIn, NoteSaveRequest
from . import auth as auth_helpers
from ..core.supabase_client import client
from ..core.note_saver import save_note, save_note_with_notification
from .routes import note
from .routes import notifications  # Added import
from . import auth

# -----------------------------------
# FASTAPI APP
# -----------------------------------
app = FastAPI(
    title="Sa Do API",
    description="A note-taking backend with AI + Gemini integration",
    version="1.0.0",
)

@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint():
    return JSONResponse(get_openapi(title="Sa Do API", version="1.0.0", routes=app.routes))

@app.get("/swagger", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Sa Do API Docs")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(note.router, prefix="/notes", tags=["notes"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])  # Added router

@app.get("/")
def root():
    return {"message": "Sa Do API is running."}

# -----------------------------------
# CORS
# -----------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# LOGGER + SCHEDULER
# -----------------------------------
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

scheduler = BackgroundScheduler()
scheduler.start()

# -----------------------------------
# NOTIFICATION JOB
# -----------------------------------
def send_notification_job(user_id: str, note_id: int):
    res = client.table("notes").select("title, content").eq("id", note_id).execute()
    # Safely access data attribute in case res is a string or other type
    data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
    note = data[0] if data and isinstance(data, list) and len(data) > 0 else None
    logger.info(f"[NOTIFY] Notify user {user_id} about note: {note.get('title') if note else note_id}")

# -----------------------------------
# AUTH ROUTES
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(data: AuthSignUp):
    result = auth_helpers.register_user(data.name, data.email, data.password)
    return {"status": "ok", "user": result}

@app.post("/auth/login")
def login(data: AuthSignIn):
    result = auth_helpers.login_user(data.email, data.password)
    return {"status": "ok", "data": result}

# -----------------------------
# CURRENT USER DEPENDENCY
# -----------------------------
def current_user(user=Depends(auth_helpers.get_user_from_token)):
    return user