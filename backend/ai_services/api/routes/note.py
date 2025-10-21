from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, validator
from typing import Optional
from ai_services.core.note_saver import save_note, save_note_with_notification, update_note, update_note_with_notification, delete_note
from ai_services.api.auth import get_user_id_from_token
from ai_services.core.supabase_client import client
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

router = APIRouter()

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()
scheduler.start()

class NoteModel(BaseModel):
    title: str
    content: str
    metadata: dict = {}

class NotifyModel(BaseModel):
    title: str
    content: str
    notify: bool = False
    notify_type: str = "daily"
    notify_time: Optional[str] = None
    end_date: Optional[str] = None  # Add end date field
    metadata: dict = {}

    @validator('end_date')
    def end_date_required_if_notify(cls, v, values):
        notify = values.get('notify')
        if notify and not v:
            raise ValueError('end_date is required when notify is True')
        return v

def send_notification_job(user_id: str, note_id: int):
    # Check if notification has expired
    try:
        res = client.table("notification_settings").select("end_date").eq("note_id", note_id).execute()
        # Safely access data attribute in case res is a string or other type
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        
        if data and len(data) > 0 and data[0].get("end_date"):
            end_date_str = data[0]["end_date"]
            # Parse the ISO format date string
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            if datetime.now().astimezone() > end_date:
                # Remove the job as it has expired
                job_id = f"notify_{user_id}_{note_id}"
                if scheduler.get_job(job_id):
                    scheduler.remove_job(job_id)
                    logger.info(f"Removed expired notification for note {note_id}")
                return
    except Exception as e:
        logger.error(f"Error checking notification end date: {e}")
    
    res = client.table("notes").select("title, content, summary").eq("id", note_id).execute()
    # Safely access data attribute in case res is a string or other type
    data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
    note = data[0] if data and isinstance(data, list) and len(data) > 0 else None
    
    # Send push notification
    if note:
        title = "Note Reminder"
        # Include the LLM summary in the notification body if available
        summary = note.get('summary', '')
        if summary:
            # Truncate summary to 200 characters to keep notification concise
            truncated_summary = summary[:200] + "..." if len(summary) > 200 else summary
            body = f"{note.get('title', 'Untitled Note')}: {truncated_summary}"
        else:
            body = f"Reminder for note: {note.get('title') if note else note_id}"
        # Import here to avoid circular imports
        from ai_services.core.push_notifications import send_push_notification
        send_push_notification(user_id, title, body, f"/editor?id={note_id}")
        logger.info(f"[NOTIFY] Sent push notification to user {user_id} about note: {note.get('title') if note else note_id}")
    else:
        logger.info(f"[NOTIFY] Notify user {user_id} about note: {note_id}")

# -----------------------------

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
def create_note(note: NoteModel, user_id: str = Depends(get_user_id_from_token)):
    logger.info(f"Received POST request to create note for user {user_id}")
    logger.info(f"Note data: {note.dict()}")
    try:
        result = save_note(user_id, note.title, note.content, note.metadata)
        logger.info(f"Note saved successfully: {result}")
        return {"message": "Note saved successfully", "data": result}
    except Exception as e:
        logger.error(f"Error saving note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify", response_model=dict)
def create_note_with_notification(note: NotifyModel, user_id: str = Depends(get_user_id_from_token)):
    logger.info(f"Received POST request to create note with notification for user {user_id}")
    logger.info(f"Note data: {note.dict()}")
    
    # Additional validation to ensure end_date is provided when notify is True
    if note.notify and not note.end_date:
        raise HTTPException(status_code=400, detail="end_date is required when notify is True")
    
    try:
        result = save_note_with_notification(
            user_id,
            note.title,
            note.content,
            note.notify,
            note.notify_type,
            note.notify_time,
            note.metadata,
            note.end_date  # Pass end date to the function
        )
        
        if note.notify:
            job_id = f"notify_{user_id}_{result['note']['id']}"

            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)

            if note.notify_type == "hourly":
                trigger = CronTrigger(minute="0")
            else:
                # daily notification at specific time
                if note.notify_time:
                    hh, mm = map(int, note.notify_time.split(":"))
                    trigger = CronTrigger(hour=hh, minute=mm)
                else:
                    trigger = CronTrigger(hour=9, minute=0)
            scheduler.add_job(send_notification_job, trigger, args=[user_id, result['note']['id']], id=job_id)
            logger.info(f"Scheduled {note.notify_type} notification for note {result['note']['id']}")
        logger.info(f"Note with notification saved successfully: {result}")
        return {"message": "Note saved with notification", "data": result}
    except Exception as e:
        logger.error(f"Error saving note with notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=dict)
@router.get("/", response_model=dict)
def get_notes(user_id: str = Depends(get_user_id_from_token)):
    try:
        # Fetch notes with their notification settings
        res = client.table("notes").select("*").eq("user_id", user_id).execute()
        # Safely access data attribute in case res is a string or other type
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        
        # If we have notes, fetch their notification settings
        if data and isinstance(data, list) and len(data) > 0:
            note_ids = [note['id'] for note in data]
            if note_ids:
                # Fetch notification settings for all notes
                notify_res = client.table("notification_settings").select("*").in_("note_id", note_ids).execute()
                notify_data = getattr(notify_res, 'data', notify_res.get('data') if isinstance(notify_res, dict) else None) if notify_res else None
                
                # Create a mapping of note_id to notification settings
                notify_map = {}
                if notify_data and isinstance(notify_data, list):
                    for notify_setting in notify_data:
                        notify_map[notify_setting['note_id']] = notify_setting
                
                # Add notification information to each note
                for note in data:
                    if note['id'] in notify_map:
                        note['notify'] = notify_map[note['id']].get('notify', False)
                        note['notify_type'] = notify_map[note['id']].get('notify_type')
                        note['notify_time'] = notify_map[note['id']].get('notify_time')
                        note['end_date'] = notify_map[note['id']].get('end_date')
                    else:
                        note['notify'] = False
                        note['notify_type'] = None
                        note['notify_time'] = None
                        note['end_date'] = None
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{note_id}")
def get_note_by_id(note_id: int, user_id: str = Depends(get_user_id_from_token)):
    try:
        res = client.table("notes").select("*").eq("id", note_id).eq("user_id", user_id).execute()
        # Safely access data attribute in case res is a string or other type
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        if data and isinstance(data, list) and len(data) > 0:
            note = data[0]
            # Fetch notification settings for this note
            try:
                notify_res = client.table("notification_settings").select("*").eq("note_id", note_id).execute()
                notify_data = getattr(notify_res, 'data', notify_res.get('data') if isinstance(notify_res, dict) else None) if notify_res else None
                if notify_data and isinstance(notify_data, list) and len(notify_data) > 0:
                    notify_setting = notify_data[0]
                    note['notify'] = notify_setting.get('notify', False)
                    note['notify_type'] = notify_setting.get('notify_type')
                    note['notify_time'] = notify_setting.get('notify_time')
                    note['end_date'] = notify_setting.get('end_date')
                else:
                    note['notify'] = False
                    note['notify_type'] = None
                    note['notify_time'] = None
                    note['end_date'] = None
            except Exception as e:
                logger.warning(f"Could not fetch notification settings for note {note_id}: {e}")
                note['notify'] = False
                note['notify_type'] = None
                note['notify_time'] = None
                note['end_date'] = None
            
            return {"data": note}
        else:
            raise HTTPException(status_code=404, detail="Note not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{note_id}")
def update_note_endpoint(note_id: int, note: NoteModel, user_id: str = Depends(get_user_id_from_token)):
    try:
        data = update_note(user_id, note_id, note.title, note.content, note.metadata)
        
        # Also remove any existing notification settings for this note
        # Directly delete notification settings from the notification table
        try:
            client.table("notification_settings").delete().eq("note_id", note_id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.warning(f"Warning: Could not remove notification settings for note {note_id}: {e}")
        
        return {"message": "Note updated successfully", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{note_id}/notify")
def update_note_notify_endpoint(note_id: int, note: NotifyModel, user_id: str = Depends(get_user_id_from_token)):
    # Additional validation to ensure end_date is provided when notify is True
    if note.notify and not note.end_date:
        raise HTTPException(status_code=400, detail="end_date is required when notify is True")
        
    try:
        result = update_note_with_notification(
            user_id,
            note_id,
            note.title,
            note.content,
            note.notify,
            note.notify_type,
            note.notify_time,
            note.metadata,
            note.end_date  # Pass end date to the function
        )
        if note.notify:
            job_id = f"notify_{user_id}_{note_id}"

            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)

            if note.notify_type == "hourly":
                trigger = CronTrigger(minute="0")
            else:
                # daily notification at specific time
                if note.notify_time:
                    hh, mm = map(int, note.notify_time.split(":"))
                    trigger = CronTrigger(hour=hh, minute=mm)
                else:
                    trigger = CronTrigger(hour=9, minute=0)
            scheduler.add_job(send_notification_job, trigger, args=[user_id, note_id], id=job_id)
            logger.info(f"Scheduled {note.notify_type} notification for note {note_id}")
        else:
            # Remove existing job if notifications are disabled
            job_id = f"notify_{user_id}_{note_id}"
            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)
                logger.info(f"Removed notification for note {note_id}")
        return {"message": "Note updated with notification", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note_endpoint(note_id: int, user_id: str = Depends(get_user_id_from_token)):
    try:
        success = delete_note(user_id, note_id)
        if success:
            return {"message": "Note deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete note")
    except Exception as e:
        logger.error(f"Error deleting note: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))