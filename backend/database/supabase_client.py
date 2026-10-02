import os

from dotenv import load_dotenv
from supabase import Client, create_client


BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
    )
)

load_dotenv(os.path.join(BASE_DIR, ".env"))


SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured.")

if not SUPABASE_SECRET_KEY:
    raise RuntimeError("SUPABASE_SECRET_KEY is not configured.")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)