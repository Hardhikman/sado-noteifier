# ai_services/supabase_client.py
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Ensure environment variables are set
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validate that required environment variables are present
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is not set")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY environment variable is not set")

# Create Supabase client with service role key for backend operations
client = create_client(SUPABASE_URL, SUPABASE_KEY)