# backend/ai_services/note_saver.py
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from threading import Thread
from .supabase_client import client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# ✅ LangChain Gemini imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
# Using newer LangChain approach instead of LLMChain

logger = logging.getLogger(__name__)

# Table names
NOTES_TABLE = "notes"
NOTIFICATION_TABLE = "notification_settings"

# ✅ Initialize Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # Using a more stable model
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.5
)

# Prompt for summarizing notes
summary_prompt = PromptTemplate(
    input_variables=["content"],
    template="""You are an AI assistant that creates notification reminders from user notes. Given a note, write a clear and actionable notification message to be sent to the user. Follow these guidelines:

- Start with a prefix appropriate for the task: Reminder, Check, Follow up, Send, Update, Share, Review, Ask, Ping, etc.
- Include key details from the note (time, date, person, deadline) for clarity.
- Be brief, actionable, and specific.
- Use "—" to separate additional context.

Examples:

Note: Meeting with Design team at 5 PM today
Notification: Reminder: Design team meeting at 5 PM today

Note: 1:1 with manager — 3 PM Thursday
Notification: Reminder: 1:1 with manager at 3 PM Thursday

Note: Client call — confirm deck before meeting (due 4 PM)
Notification: Reminder: Confirm client deck before 4 PM call

Note: Awaiting file from Hardhik — check by EOD
Notification: Check if Hardhik's file has arrived — EOD

Note: Follow up with Priya if report not received by 6 PM
Notification: Follow up with Priya on report if not received by 6 PM

Note: Confirm shipment with vendor — pending reply
Notification: Check vendor shipment status — pending reply

Note: Update KPI metrics in dashboard
Notification: Update KPI metrics in dashboard today

Note: Send weekly summary to manager — 5 PM Friday
Notification: Send weekly summary to manager — 5 PM Friday

Note: Ping Rohan for project update
Notification: Ping Rohan for project update

Note: Feature idea: auto-text when user views profile
Notification: Feature idea: auto-text on profile view — review later

Note: Ask tech team about API rate limit
Notification: Ask tech team about API rate limit

Now, given this note, generate the notification in the same style:

{content}"""
)


def _now_iso():
    """Returns the current UTC timestamp in ISO format."""
    return datetime.utcnow().isoformat()


def update_note_summary_async(note_id: int, content: str):
    """Asynchronously update note summary using AI."""
    try:
        summary = summarize_note_content(content)
        # Update the note with the generated summary
        payload = {"summary": summary}
        client.table(NOTES_TABLE).update(payload).eq("id", note_id).execute()
        logger.info(f"Successfully updated summary for note {note_id}")
    except Exception as e:
        logger.error(f"Failed to update summary for note {note_id}: {e}")
        # Update with a fallback summary
        try:
            fallback_summary = content[:200] + "..." if len(content) > 200 else content
            payload = {"summary": fallback_summary}
            client.table(NOTES_TABLE).update(payload).eq("id", note_id).execute()
        except Exception as fallback_error:
            logger.error(f"Failed to update fallback summary for note {note_id}: {fallback_error}")


def summarize_note_content(content: str) -> str:
    """Use Gemini via LangChain to summarize a note."""
    if not content or not content.strip():
        return "No content provided for summarization."
    try:
        # Using newer LangChain approach instead of LLMChain
        # The llm can be called directly with the prompt
        response = llm.invoke(summary_prompt.format(content=content))
        # Handle different response types
        if hasattr(response, 'content'):
            content_value = response.content
            if isinstance(content_value, list):
                # If content is a list, join it into a string
                return ' '.join(str(item) for item in content_value).strip()
            elif isinstance(content_value, str):
                return content_value.strip()
            else:
                return str(content_value).strip()
        elif isinstance(response, str):
            return response.strip()
        else:
            return str(response).strip()
    except Exception as e:
        logger.error(f"Gemini summarization failed: {e}")
        # Return a simple fallback summary instead of failing completely
        content_preview = content[:100] + "..." if len(content) > 100 else content
        return f"Note preview: {content_preview}"


def save_note(user_id: str, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict:
    """Save a note to Supabase, with placeholder summary included."""
    # Use placeholder summary to avoid blocking the save operation
    summary = "Summary will be generated shortly..."
    
    payload = {
        "user_id": user_id,
        "title": title or "Untitled Note",
        "content": content or "",
        "summary": summary,
        "metadata": metadata or {},
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }

    try:
        res = client.table(NOTES_TABLE).insert(payload).execute()
        # Safely access error and data attributes in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.error("Error inserting note: %s", error)
            # Log the payload for debugging
            logger.error("Payload that caused error: %s", payload)
            raise RuntimeError(f"Database error: {error}")
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        result = data[0] if data and isinstance(data, list) and len(data) > 0 else data if isinstance(data, dict) else None
        
        # Generate AI summary asynchronously after saving
        if result and result.get('id'):
            thread = Thread(target=update_note_summary_async, args=(result['id'], content))
            thread.start()
        
        return result if result is not None else {}
    except Exception as e:
        logger.error("Exception during note insertion: %s", str(e))
        # Log the payload for debugging
        logger.error("Payload that caused exception: %s", payload)
        raise RuntimeError(f"Failed to save note: {str(e)}")


def save_note_with_notification(
    user_id: str,
    title: str,
    content: str,
    notify: bool,
    notify_type: Optional[str] = None,
    notify_time: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    end_date: Optional[str] = None,  # Add end_date parameter
) -> Dict:
    """Save note with optional notification preference."""
    note = save_note(user_id, title, content, metadata)

    if notify:
        # Validate that end_date is provided when notify is True
        if not end_date:
            raise ValueError("end_date is required when notify is True")
            
        notify_type = (notify_type or "daily").lower()
        payload = {
            "user_id": user_id,
            "note_id": note.get("id"),
            "notify": True,
            "notify_type": notify_type,
            "notify_time": notify_time or None,
            "end_date": end_date,  # Add end_date to payload (required now)
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }

        res = client.table(NOTIFICATION_TABLE).insert(payload).execute()
        # Safely access error and data attributes in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.error("Error inserting notification: %s", error)
            raise RuntimeError(error)
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        notification_data = data[0] if data and isinstance(data, list) and len(data) > 0 else data if isinstance(data, dict) else None

        return {"note": note, "notification": notification_data}

    return {"note": note, "notification": None}


def update_note(user_id: str, note_id: int, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict:
    """Update an existing note in Supabase, with placeholder summary included."""
    # Use placeholder summary to avoid blocking the update operation
    summary = "Summary will be updated shortly..."
    
    payload = {
        "title": title or "Untitled Note",
        "content": content or "",
        "summary": summary,
        "metadata": metadata or {},
        "updated_at": _now_iso(),
    }

    try:
        res = client.table(NOTES_TABLE).update(payload).eq("id", note_id).eq("user_id", user_id).execute()
        # Safely access error and data attributes in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.error("Error updating note: %s", error)
            # Log the payload for debugging
            logger.error("Payload that caused error: %s", payload)
            raise RuntimeError(f"Database error: {error}")
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        result = data[0] if data and isinstance(data, list) and len(data) > 0 else data if isinstance(data, dict) else None
        
        # Generate AI summary asynchronously after updating
        if result:
            thread = Thread(target=update_note_summary_async, args=(note_id, content))
            thread.start()
        
        return result if result is not None else {}
    except Exception as e:
        logger.error("Exception during note update: %s", str(e))
        # Log the payload for debugging
        logger.error("Payload that caused exception: %s", payload)
        raise RuntimeError(f"Failed to update note: {str(e)}")


def update_note_with_notification(
    user_id: str,
    note_id: int,
    title: str,
    content: str,
    notify: bool,
    notify_type: Optional[str] = None,
    notify_time: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    end_date: Optional[str] = None,  # Add end_date parameter
) -> Dict:
    """Update note with optional notification preference."""
    note = update_note(user_id, note_id, title, content, metadata)

    # Update or insert notification setting
    if notify:
        # Validate that end_date is provided when notify is True
        if not end_date:
            raise ValueError("end_date is required when notify is True")
            
        notify_type = (notify_type or "daily").lower()
        payload = {
            "user_id": user_id,
            "note_id": note_id,
            "notify": True,
            "notify_type": notify_type,
            "notify_time": notify_time or None,
            "end_date": end_date,  # Add end_date to payload (required now)
            "updated_at": _now_iso(),
        }

        # First try to update existing notification
        res = client.table(NOTIFICATION_TABLE).update(payload).eq("note_id", note_id).eq("user_id", user_id).execute()
        # Check if update affected any rows
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        if not data:
            # If no rows were updated, insert new notification
            payload["created_at"] = _now_iso()
            res = client.table(NOTIFICATION_TABLE).insert(payload).execute()
        
        # Safely access error attribute in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.error("Error updating/inserting notification: %s", error)
            raise RuntimeError(error)
            
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        notification_data = data[0] if data and isinstance(data, list) and len(data) > 0 else data if isinstance(data, dict) else None

        return {"note": note, "notification": notification_data}

    # If notify is False, delete existing notification if it exists
    else:
        res = client.table(NOTIFICATION_TABLE).delete().eq("note_id", note_id).eq("user_id", user_id).execute()
        # Safely access error attribute in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.warning("Warning: Error deleting notification: %s", error)
        return {"note": note, "notification": None}


def delete_note(user_id: str, note_id: int) -> bool:
    """Delete a note from Supabase."""
    try:
        # First delete any associated notifications
        res = client.table(NOTIFICATION_TABLE).delete().eq("note_id", note_id).eq("user_id", user_id).execute()
        # Safely access error attribute in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.warning("Warning: Error deleting notification: %s", error)
        
        # Then delete the note itself
        res = client.table(NOTES_TABLE).delete().eq("id", note_id).eq("user_id", user_id).execute()
        # Safely access error attribute in case res is a string or other type
        error = getattr(res, 'error', res.get('error') if isinstance(res, dict) else None) if res else None
        if error:
            logger.error("Error deleting note: %s", error)
            raise RuntimeError(f"Database error: {error}")
        
        return True
    except Exception as e:
        logger.error("Exception during note deletion: %s", str(e))
        raise RuntimeError(f"Failed to delete note: {str(e)}")