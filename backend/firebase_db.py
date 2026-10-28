"""
Firebase Cloud Firestore database abstraction layer for Alumni Management System.
"""
import os
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")
_db = None
_id_locks: Dict[str, threading.Lock] = {}

def get_firestore_client():
    global _db
    if _db is not None:
        return _db

    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
    raw_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID is not configured.")
    if not cred_path and not raw_json:
        raise RuntimeError(
            "Set FIREBASE_CREDENTIALS_PATH to a service-account file or "
            "FIREBASE_SERVICE_ACCOUNT_JSON to the service-account JSON secret."
        )

    resolved_cred = None
    if cred_path:
        resolved_cred = Path(cred_path)
        if not resolved_cred.is_absolute():
            resolved_cred = (HERE / resolved_cred).resolve()

    # Use a mounted secret file when present; otherwise allow JSON supplied as a secret env var.
    if resolved_cred is not None and resolved_cred.is_file():
        cred = credentials.Certificate(str(resolved_cred))
    else:
        if not raw_json:
            raise RuntimeError(
                f"Firebase service-account file was not found at {resolved_cred}. "
                "Upload the JSON as a secret file and set FIREBASE_CREDENTIALS_PATH, "
                "or configure FIREBASE_SERVICE_ACCOUNT_JSON."
            )
        import json
        try:
            cred = credentials.Certificate(json.loads(raw_json))
        except Exception as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is not valid service-account JSON."
            ) from exc

    # Reuse an existing default app during test reloads.
    if firebase_admin._apps:
        app = firebase_admin.get_app()
    else:
        app = firebase_admin.initialize_app(cred, {"projectId": project_id})
    _db = firestore.client(app=app)
    return _db


def _get_next_id(collection_name: str) -> int:
    """Compatibility ID generator. Transactional counter prevents concurrent duplicates."""
    db = get_firestore_client()
    counter_ref = db.collection("_counters").document(collection_name)

    @firestore.transactional
    def reserve(transaction):
        snap = counter_ref.get(transaction=transaction)
        if snap.exists:
            last_id = int((snap.to_dict() or {}).get("last_id", 0))
        else:
            last_id = 0
            for doc in db.collection(collection_name).stream():
                try:
                    last_id = max(last_id, int(doc.id))
                except (TypeError, ValueError):
                    try:
                        last_id = max(last_id, int((doc.to_dict() or {}).get("id", 0)))
                    except (TypeError, ValueError):
                        pass
        next_id = last_id + 1
        transaction.set(counter_ref, {"last_id": next_id})
        return next_id

    return reserve(db.transaction())


# ==============================================================================
# USER OPERATIONS
# ==============================================================================
def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    if not user_id:
        return None
    doc = get_firestore_client().collection("users").document(str(user_id)).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    try:
        data["id"] = int(doc.id)
    except ValueError:
        data.setdefault("id", doc.id)
    return data


def _find_user(field: str, value: str, role: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not value:
        return None
    target = value.strip().casefold()
    for doc in get_firestore_client().collection("users").stream():
        data = doc.to_dict() or {}
        actual = str(data.get(field) or "").strip().casefold()
        if actual == target and (role is None or data.get("role") == role):
            try:
                data["id"] = int(doc.id)
            except ValueError:
                data.setdefault("id", doc.id)
            return data
    return None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return _find_user("email", email)


def get_user_by_username(username: str, role: Optional[str] = None) -> Optional[Dict[str, Any]]:
    return _find_user("username", username, role)


def get_user_by_uucms_id(uucms_id: str, role: Optional[str] = None) -> Optional[Dict[str, Any]]:
    return _find_user("uucms_id", uucms_id, role)


def get_user_by_faculty_id(faculty_id: str) -> Optional[Dict[str, Any]]:
    return _find_user("faculty_id", faculty_id, "faculty")


def get_user_by_admin_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    if not identifier:
        return None
    value = identifier.strip().casefold()
    for doc in get_firestore_client().collection("users").where("role", "==", "admin").stream():
        data = doc.to_dict() or {}
        if value in (str(data.get("email") or "").strip().casefold(),
                     str(data.get("username") or "").strip().casefold()):
            try:
                data["id"] = int(doc.id)
            except ValueError:
                data.setdefault("id", doc.id)
            return data
    return None


def get_all_users(role: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    results = []
    for doc in get_firestore_client().collection("users").stream():
        data = doc.to_dict() or {}
        try:
            data["id"] = int(doc.id)
        except ValueError:
            data.setdefault("id", doc.id)
        if role and data.get("role") != role:
            continue
        if status and data.get("status") != status:
            continue
        results.append(data)
    results.sort(key=lambda item: str(item.get("id", "")))
    return results


def create_user(user_data: Dict[str, Any]) -> int:
    new_id = _get_next_id("users")
    payload = dict(user_data, id=new_id)
    get_firestore_client().collection("users").document(str(new_id)).create(payload)
    return new_id


def update_user(user_id: int, updates: Dict[str, Any]) -> bool:
    ref = get_firestore_client().collection("users").document(str(user_id))
    if not ref.get().exists:
        return False
    ref.update(updates)
    return True


def delete_user(user_id: int) -> bool:
    ref = get_firestore_client().collection("users").document(str(user_id))
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def _get_items(collection_name: str) -> List[Dict[str, Any]]:
    rows = []
    for doc in get_firestore_client().collection(collection_name).stream():
        data = doc.to_dict() or {}
        try:
            data["id"] = int(doc.id)
        except ValueError:
            data.setdefault("id", doc.id)
        rows.append(data)
    return rows


def get_postings(posting_type: Optional[str] = None, alumni_id: Optional[int] = None) -> List[Dict[str, Any]]:
    rows = []
    for data in _get_items("postings"):
        if posting_type and data.get("type") != posting_type:
            continue
        if alumni_id and data.get("alumni_id") != alumni_id:
            continue
        alumni = get_user_by_id(data.get("alumni_id")) if data.get("alumni_id") else None
        data["alumni_name"] = alumni.get("name") if alumni else "Unknown"
        data["alumni_email"] = alumni.get("email") if alumni else ""
        data["alumni_company"] = alumni.get("company") if alumni else ""
        rows.append(data)
    rows.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    return rows


def get_posting_by_id(posting_id: int) -> Optional[Dict[str, Any]]:
    for item in _get_items("postings"):
        if str(item.get("id")) == str(posting_id):
            alumni = get_user_by_id(item.get("alumni_id")) if item.get("alumni_id") else None
            item["alumni_name"] = alumni.get("name") if alumni else "Unknown"
            return item
    return None


def create_posting(posting_data: Dict[str, Any]) -> int:
    new_id = _get_next_id("postings")
    payload = dict(posting_data, id=new_id)
    payload.setdefault("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    get_firestore_client().collection("postings").document(str(new_id)).create(payload)
    return new_id


def get_resources(faculty_id: Optional[int] = None) -> List[Dict[str, Any]]:
    rows = _get_items("resources")
    for item in rows:
        fid = item.get("faculty_id")
        faculty = get_user_by_id(fid) if fid else None
        item["faculty_name"] = faculty.get("name") if faculty else "Faculty Member"
        item["faculty_dept"] = faculty.get("department") if faculty else ""
    return [item for item in rows if not faculty_id or item.get("faculty_id") == faculty_id]


def get_resource_by_id(resource_id: int) -> Optional[Dict[str, Any]]:
    for item in _get_items("resources"):
        if str(item.get("id")) == str(resource_id):
            return item
    return None


def create_resource(resource_data: Dict[str, Any]) -> int:
    new_id = _get_next_id("resources")
    get_firestore_client().collection("resources").document(str(new_id)).create(dict(resource_data, id=new_id))
    return new_id


def get_announcements() -> List[Dict[str, Any]]:
    rows = _get_items("announcements")
    for item in rows:
        poster = get_user_by_id(item.get("posted_by")) if item.get("posted_by") else None
        item["posted_by_name"] = poster.get("name") if poster else "Admin"
        item["poster_role"] = poster.get("role") if poster else ""
    rows.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    return rows


def create_announcement(announcement_data: Dict[str, Any]) -> int:
    new_id = _get_next_id("announcements")
    payload = dict(announcement_data, id=new_id)
    payload.setdefault("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    get_firestore_client().collection("announcements").document(str(new_id)).create(payload)
    return new_id


def get_chat(user1_id: int, user2_id: int) -> List[Dict[str, Any]]:
    rows = _get_items("messages")
    return sorted(
        [item for item in rows if
         (item.get("sender_id") == user1_id and item.get("receiver_id") == user2_id) or
         (item.get("sender_id") == user2_id and item.get("receiver_id") == user1_id)],
        key=lambda item: str(item.get("created_at", ""))
    )


def get_user_conversations(user_id: int) -> List[Dict[str, Any]]:
    messages = _get_items("messages")
    latest = {}
    for item in messages:
        sender, receiver = item.get("sender_id"), item.get("receiver_id")
        partner_id = receiver if sender == user_id else sender if receiver == user_id else None
        if partner_id:
            if partner_id not in latest or str(item.get("created_at", "")) > str(latest[partner_id].get("created_at", "")):
                latest[partner_id] = item
    conversations = []
    for partner_id, message in latest.items():
        partner = get_user_by_id(partner_id)
        if partner:
            conversations.append({"partner": partner, "last_message": message})
    return sorted(conversations, key=lambda item: str(item["last_message"].get("created_at", "")), reverse=True)


def send_message(sender_id: int, receiver_id: int, content: str) -> int:
    new_id = _get_next_id("messages")
    payload = {
        "id": new_id, "sender_id": sender_id, "receiver_id": receiver_id,
        "content": content, "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    get_firestore_client().collection("messages").document(str(new_id)).create(payload)
    return new_id
