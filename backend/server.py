from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Query
from fastapi.responses import StreamingResponse, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
import logging, uuid, re, io, csv, base64, secrets, asyncio, ipaddress
import bcrypt, jwt, httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

# ------------------------------------------------------------------ DB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

app = FastAPI(title="CloudWave Technologies API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cloudwave")


# ------------------------------------------------------------------ helpers
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def new_id():
    return str(uuid.uuid4())

def slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return s or new_id()[:8]

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ------------------------------------------------------------------ auth models
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    password: str


@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"], email)
    return {"token": token, "user": {"id": user["id"], "email": email,
            "name": user.get("name"), "role": user.get("role", "admin")}}

@api.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin

@api.post("/auth/logout")
async def logout(admin=Depends(get_current_admin)):
    return {"ok": True}

@api.post("/auth/forgot-password")
async def forgot(body: ForgotIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        tok = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": tok, "user_id": user["id"], "used": False,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()})
        logger.info(f"[PASSWORD RESET] link token for {body.email}: {tok}")
    return {"ok": True, "message": "If the email exists, a reset link has been sent."}

@api.post("/auth/reset-password")
async def reset(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec or rec["expires_at"] < now_iso():
        raise HTTPException(400, "Invalid or expired token")
    await db.users.update_one({"id": rec["user_id"]},
                              {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}


# ------------------------------------------------------------------ media upload (base64 stored in mongo)
ALLOWED_IMG = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
BACKEND_PUBLIC = os.environ.get("BACKEND_PUBLIC_URL", "")

@api.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    if file.content_type not in ALLOWED_IMG:
        raise HTTPException(400, "Only JPG, PNG, WEBP, GIF images are allowed")
    data = await file.read()
    if len(data) > 6 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 6MB)")
    mid = new_id()
    await db.media_files.insert_one({
        "id": mid, "content_type": file.content_type,
        "data": base64.b64encode(data).decode(), "created_at": now_iso()})
    return {"url": f"/api/media/{mid}", "id": mid}

@api.get("/media/{mid}")
async def get_media(mid: str):
    rec = await db.media_files.find_one({"id": mid}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Not found")
    return Response(content=base64.b64decode(rec["data"]),
                    media_type=rec["content_type"],
                    headers={"Cache-Control": "public, max-age=31536000"})


# ------------------------------------------------------------------ EMAIL (Emergent-managed Resend)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "CloudWave Technologies")

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls = set(), []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError("Email links/assets must be absolute https")

async def send_email(*, to: str, subject: str, html: str):
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                            headers={"X-Email-Key": EMAIL_KEY}, json=payload)
    resp.raise_for_status()
    return resp.json().get("id")

async def notify_admins_new_enquiry(enq: dict):
    if not EMAIL_KEY:
        return
    recips = [e.strip() for e in os.environ.get("NOTIFY_EMAILS", "").split(",") if e.strip()]
    if not recips:
        admins = await db.users.find({"role": "admin"}, {"_id": 0, "email": 1}).to_list(50)
        recips = [a["email"] for a in admins]
    subject = f"New Enquiry: {enq.get('name')} — {enq.get('course_name') or 'General'}"
    rows = [("Enquiry ID", enq.get("enquiry_id")), ("Name", enq.get("name")),
            ("Email", enq.get("email")), ("Mobile", enq.get("mobile")),
            ("WhatsApp", enq.get("whatsapp")), ("Course", enq.get("course_name")),
            ("Batch", enq.get("batch_name")), ("Preferred Mode", enq.get("mode")),
            ("City", enq.get("city")), ("Source", enq.get("source")),
            ("Message", enq.get("message"))]
    tr = "".join(f'<tr><td style="padding:6px 12px;color:#64748b;font-weight:600">{escape(str(k))}</td>'
                 f'<td style="padding:6px 12px;color:#0f172a">{escape(str(v or "-"))}</td></tr>' for k, v in rows)
    html = (f'<table role="presentation" width="100%" style="font-family:Arial,sans-serif">'
            f'<tr><td style="padding:20px">'
            f'<h2 style="color:#1D4ED8;margin:0 0 4px">New Student Enquiry</h2>'
            f'<p style="color:#475569;margin:0 0 16px">A new enquiry was submitted on the CloudWave Technologies website.</p>'
            f'<table role="presentation" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate">{tr}</table>'
            f'<p style="font-size:12px;color:#94a3b8;margin-top:16px">Sent by {escape(EMAIL_FROM_NAME)}. '
            f'Sign in to your admin dashboard to view and manage this enquiry. '
            f'We never ask for your password or payment details by email.</p>'
            f'</td></tr></table>')
    for r in recips:
        try:
            await send_email(to=r, subject=subject, html=html)
        except Exception as e:
            logger.error(f"Enquiry notification email failed for {r}: {e}")


# ------------------------------------------------------------------ generic CRUD factory
# resource -> (collection, published_field)
RESOURCES = {
    "courses": ("courses", "published"),
    "batches": ("batches", "published"),
    "trainers": ("trainers", "active"),
    "testimonials": ("testimonials", "published"),
    "faqs": ("faqs", "published"),
    "blog": ("blog_posts", "published"),
    "gallery": ("gallery", "published"),
    "videos": ("videos", "published"),
    "events": ("events", "published"),
    "placements": ("placements", "published"),
    "themes": ("themes", None),
}

def clean(doc):
    doc.pop("_id", None)
    return doc

@api.get("/admin/data/{resource}")
async def admin_list(resource: str, admin=Depends(get_current_admin)):
    if resource not in RESOURCES:
        raise HTTPException(404, "Unknown resource")
    col = RESOURCES[resource][0]
    items = await db[col].find({}, {"_id": 0}).sort("sort_order", 1).to_list(2000)
    items.sort(key=lambda x: (x.get("sort_order", 0), x.get("created_at", "")))
    return items

@api.post("/admin/data/{resource}")
async def admin_create(resource: str, body: Dict[str, Any], admin=Depends(get_current_admin)):
    if resource not in RESOURCES:
        raise HTTPException(404, "Unknown resource")
    col = RESOURCES[resource][0]
    body["id"] = new_id()
    body["created_at"] = now_iso()
    body["updated_at"] = now_iso()
    if "sort_order" not in body:
        body["sort_order"] = await db[col].count_documents({})
    if resource in ("courses", "blog") and body.get("name" if resource == "courses" else "title"):
        base = body.get("name") if resource == "courses" else body.get("title")
        body["slug"] = body.get("slug") or slugify(base)
    await db[col].insert_one(dict(body))
    return clean(body)

@api.put("/admin/data/{resource}/{item_id}")
async def admin_update(resource: str, item_id: str, body: Dict[str, Any], admin=Depends(get_current_admin)):
    if resource not in RESOURCES:
        raise HTTPException(404, "Unknown resource")
    col = RESOURCES[resource][0]
    body.pop("id", None); body.pop("_id", None)
    body["updated_at"] = now_iso()
    res = await db[col].update_one({"id": item_id}, {"$set": body})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    doc = await db[col].find_one({"id": item_id}, {"_id": 0})
    return doc

@api.delete("/admin/data/{resource}/{item_id}")
async def admin_delete(resource: str, item_id: str, admin=Depends(get_current_admin)):
    if resource not in RESOURCES:
        raise HTTPException(404, "Unknown resource")
    col = RESOURCES[resource][0]
    await db[col].delete_one({"id": item_id})
    return {"ok": True}


# ------------------------------------------------------------------ PUBLIC read endpoints
async def pub_list(col, pub_field, extra=None):
    q = {}
    if pub_field:
        q[pub_field] = True
    if extra:
        q.update(extra)
    items = await db[col].find(q, {"_id": 0}).to_list(2000)
    items.sort(key=lambda x: (x.get("sort_order", 0), x.get("created_at", "")))
    return items

@api.get("/settings")
async def get_settings():
    s = await db.website_settings.find_one({"id": "main"}, {"_id": 0})
    return s or {}

@api.put("/admin/settings")
async def update_settings(body: Dict[str, Any], admin=Depends(get_current_admin)):
    body["id"] = "main"; body["updated_at"] = now_iso()
    await db.website_settings.update_one({"id": "main"}, {"$set": body}, upsert=True)
    return await db.website_settings.find_one({"id": "main"}, {"_id": 0})

@api.get("/courses")
async def public_courses(category: Optional[str] = None, featured: Optional[bool] = None):
    extra = {}
    if category: extra["category"] = category
    if featured is not None: extra["featured"] = featured
    return await pub_list("courses", "published", extra)

@api.get("/courses/{slug}")
async def public_course(slug: str):
    c = await db.courses.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not c:
        c = await db.courses.find_one({"id": slug}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Course not found")
    return c

@api.get("/batches")
async def public_batches(course_id: Optional[str] = None):
    extra = {"course_id": course_id} if course_id else None
    return await pub_list("batches", "published", extra)

@api.get("/trainers")
async def public_trainers():
    return await pub_list("trainers", "active")

@api.get("/testimonials")
async def public_testimonials():
    return await pub_list("testimonials", "published")

@api.get("/faqs")
async def public_faqs(category: Optional[str] = None):
    extra = {"category": category} if category else None
    return await pub_list("faqs", "published", extra)

@api.get("/blog")
async def public_blog(category: Optional[str] = None):
    extra = {"category": category} if category else None
    return await pub_list("blog_posts", "published", extra)

@api.get("/blog/{slug}")
async def public_blog_post(slug: str):
    p = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Post not found")
    return p

@api.get("/gallery")
async def public_gallery(category: Optional[str] = None, year: Optional[str] = None):
    extra = {}
    if category and category != "All": extra["category"] = category
    if year: extra["year"] = year
    return await pub_list("gallery", "published", extra)

@api.get("/videos")
async def public_videos(category: Optional[str] = None):
    extra = {"category": category} if category else None
    return await pub_list("videos", "published", extra)

@api.get("/events")
async def public_events():
    return await pub_list("events", "published")

@api.get("/events/{item_id}")
async def public_event(item_id: str):
    e = await db.events.find_one({"id": item_id, "published": True}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Event not found")
    return e

@api.get("/placements")
async def public_placements(course: Optional[str] = None, company: Optional[str] = None, year: Optional[str] = None):
    extra = {}
    if course: extra["course"] = course
    if company: extra["company_name"] = company
    if year: extra["placement_year"] = year
    return await pub_list("placements", "published", extra)

@api.get("/theme/active")
async def active_theme():
    settings = await db.website_settings.find_one({"id": "main"}, {"_id": 0}) or {}
    if settings.get("theme_mode") == "off":
        return {"theme": None}
    today = datetime.now(timezone.utc).date().isoformat()
    themes = await db.themes.find({"is_active": True}, {"_id": 0}).to_list(200)
    active = []
    for t in themes:
        sd, ed = t.get("start_date"), t.get("end_date")
        if sd and sd > today:
            continue
        if ed and ed < today:
            continue
        active.append(t)
    if not active:
        return {"theme": None}
    active.sort(key=lambda x: x.get("priority", 0), reverse=True)
    return {"theme": active[0]}


# ------------------------------------------------------------------ ENQUIRIES (public submit + admin manage)
class EnquiryIn(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    whatsapp: Optional[str] = ""
    course_id: Optional[str] = ""
    course_name: Optional[str] = ""
    batch_id: Optional[str] = ""
    batch_name: Optional[str] = ""
    mode: Optional[str] = ""
    city: Optional[str] = ""
    message: Optional[str] = ""
    source: Optional[str] = "Website"
    consent: bool

@api.post("/enquiries")
async def create_enquiry(body: EnquiryIn):
    if not re.match(r'^[6-9]\d{9}$', re.sub(r'\D', '', body.mobile)[-10:]):
        raise HTTPException(422, "Please enter a valid 10-digit Indian mobile number")
    if not body.consent:
        raise HTTPException(422, "Consent is required")
    count = await db.enquiries.count_documents({}) + 1
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["enquiry_id"] = f"CW{datetime.now().strftime('%y%m')}{count:04d}"
    doc["status"] = "New"
    doc["follow_up_date"] = ""
    doc["notes"] = []
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.enquiries.insert_one(dict(doc))
    asyncio.create_task(notify_admins_new_enquiry(dict(doc)))
    return {"ok": True, "enquiry_id": doc["enquiry_id"], "message": "Enquiry submitted successfully"}

@api.get("/admin/enquiries")
async def list_enquiries(admin=Depends(get_current_admin),
                         search: Optional[str] = None, status: Optional[str] = None,
                         course_id: Optional[str] = None, source: Optional[str] = None,
                         date_from: Optional[str] = None, date_to: Optional[str] = None,
                         page: int = 1, page_size: int = 20):
    q = {}
    if status and status != "All": q["status"] = status
    if course_id and course_id != "All": q["course_id"] = course_id
    if source and source != "All": q["source"] = source
    if date_from: q.setdefault("created_at", {})["$gte"] = date_from
    if date_to: q.setdefault("created_at", {})["$lte"] = date_to + "T23:59:59"
    if search:
        rx = {"$regex": re.escape(search), "$options": "i"}
        q["$or"] = [{"name": rx}, {"email": rx}, {"mobile": rx},
                    {"enquiry_id": rx}, {"course_name": rx}]
    total = await db.enquiries.count_documents(q)
    items = await db.enquiries.find(q, {"_id": 0}).sort("created_at", -1) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}

@api.put("/admin/enquiries/{item_id}")
async def update_enquiry(item_id: str, body: Dict[str, Any], admin=Depends(get_current_admin)):
    body.pop("id", None); body.pop("_id", None)
    body["updated_at"] = now_iso()
    r = await db.enquiries.update_one({"id": item_id}, {"$set": body})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return await db.enquiries.find_one({"id": item_id}, {"_id": 0})

@api.post("/admin/enquiries/{item_id}/notes")
async def add_enquiry_note(item_id: str, body: Dict[str, Any], admin=Depends(get_current_admin)):
    note = {"id": new_id(), "text": body.get("text", ""),
            "author": admin.get("name", "Admin"), "created_at": now_iso()}
    r = await db.enquiries.update_one({"id": item_id}, {"$push": {"notes": note}})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return note

@api.delete("/admin/enquiries/{item_id}")
async def delete_enquiry(item_id: str, admin=Depends(get_current_admin)):
    await db.enquiries.delete_one({"id": item_id})
    return {"ok": True}

@api.get("/admin/enquiries-export")
async def export_enquiries(admin=Depends(get_current_admin)):
    items = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Enquiry ID", "Name", "Email", "Mobile", "WhatsApp", "Course",
                "Batch", "Status", "Notes", "Created Date"])
    for e in items:
        notes = " | ".join(n.get("text", "") for n in e.get("notes", []))
        w.writerow([e.get("enquiry_id"), e.get("name"), e.get("email"), e.get("mobile"),
                    e.get("whatsapp"), e.get("course_name"), e.get("batch_name"),
                    e.get("status"), notes, e.get("created_at", "")[:10]])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=enquiries.csv"})


# ------------------------------------------------------------------ CONTACT messages
class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    subject: Optional[str] = ""
    message: str

@api.post("/contact")
async def create_contact(body: ContactIn):
    doc = body.model_dump()
    doc["id"] = new_id(); doc["status"] = "New"; doc["created_at"] = now_iso()
    await db.contact_messages.insert_one(dict(doc))
    return {"ok": True, "message": "Message sent successfully"}

@api.get("/admin/contact-messages")
async def list_contact(admin=Depends(get_current_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api.delete("/admin/contact-messages/{item_id}")
async def delete_contact(item_id: str, admin=Depends(get_current_admin)):
    await db.contact_messages.delete_one({"id": item_id})
    return {"ok": True}


# ------------------------------------------------------------------ ADMIN users management
@api.get("/admin/users")
async def list_users(admin=Depends(get_current_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(200)

@api.post("/admin/users")
async def create_user(body: Dict[str, Any], admin=Depends(get_current_admin)):
    email = body["email"].lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")
    doc = {"id": new_id(), "email": email, "name": body.get("name", "Admin"),
           "role": body.get("role", "admin"), "password_hash": hash_password(body["password"]),
           "created_at": now_iso()}
    await db.users.insert_one(doc)
    return {"id": doc["id"], "email": email, "name": doc["name"], "role": doc["role"]}

@api.delete("/admin/users/{item_id}")
async def delete_user(item_id: str, admin=Depends(get_current_admin)):
    count = await db.users.count_documents({})
    if count <= 1:
        raise HTTPException(400, "Cannot delete the last admin")
    await db.users.delete_one({"id": item_id})
    return {"ok": True}


# ------------------------------------------------------------------ DASHBOARD stats
@api.get("/admin/stats")
async def stats(admin=Depends(get_current_admin)):
    enq = await db.enquiries.find({}, {"_id": 0}).to_list(10000)
    by_status = {}
    for e in enq:
        by_status[e.get("status", "New")] = by_status.get(e.get("status", "New"), 0) + 1
    by_course = {}
    for e in enq:
        cn = e.get("course_name") or "Not specified"
        by_course[cn] = by_course.get(cn, 0) + 1
    by_month = {}
    for e in enq:
        m = (e.get("created_at") or "")[:7]
        if m: by_month[m] = by_month.get(m, 0) + 1
    return {
        "total_enquiries": len(enq),
        "new_enquiries": by_status.get("New", 0),
        "contacted": by_status.get("Contacted", 0),
        "converted": by_status.get("Converted", 0),
        "total_courses": await db.courses.count_documents({}),
        "active_batches": await db.batches.count_documents({"status": {"$in": ["Upcoming", "Filling Fast", "Started"]}}),
        "total_trainers": await db.trainers.count_documents({}),
        "total_placements": await db.placements.count_documents({}),
        "by_status": [{"name": k, "value": v} for k, v in by_status.items()],
        "by_course": sorted([{"name": k, "value": v} for k, v in by_course.items()], key=lambda x: -x["value"])[:6],
        "by_month": [{"name": k, "value": v} for k, v in sorted(by_month.items())][-6:],
        "recent": sorted(enq, key=lambda x: x.get("created_at", ""), reverse=True)[:5],
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------ SEED
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.enquiries.create_index("enquiry_id")
    await db.courses.create_index("slug")
    await db.blog_posts.create_index("slug")

    # admins
    for em, pw, nm in [(os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "CloudWave Admin"),
                       (os.environ.get("OWNER_EMAIL"), os.environ.get("OWNER_PASSWORD"), "Owner")]:
        if not em:
            continue
        em = em.lower()
        ex = await db.users.find_one({"email": em})
        if not ex:
            await db.users.insert_one({"id": new_id(), "email": em, "name": nm,
                "role": "admin", "password_hash": hash_password(pw), "created_at": now_iso()})
        elif not verify_password(pw, ex["password_hash"]):
            await db.users.update_one({"email": em}, {"$set": {"password_hash": hash_password(pw)}})

    await seed_content()


async def seed_content():
    if not await db.website_settings.find_one({"id": "main"}):
        await db.website_settings.insert_one({
            "id": "main", "institute_name": "CloudWave Technologies",
            "tagline": "Launch Your IT Career in the Cloud",
            "logo_url": "", "phone": "8262030386", "phone_alt": "9921218389",
            "whatsapp": "918262030386", "email": "admin@cloudwavetechnologies.org",
            "address": "CloudWave Technologies Pvt Ltd, Pune, Maharashtra, India",
            "maps_url": "https://www.google.com/maps?q=Pune,Maharashtra",
            "facebook": "https://facebook.com", "instagram": "https://instagram.com",
            "linkedin": "https://linkedin.com", "youtube": "https://youtube.com",
            "twitter": "https://twitter.com",
            "youtube_channel": "https://youtube.com",
            "instagram_profile": "https://instagram.com",
            "working_hours": "Mon - Sat: 9:00 AM - 8:00 PM",
            "hero_title": "Launch Your IT Career with Industry-Ready Training",
            "hero_description": "CloudWave Technologies delivers hands-on, placement-focused training in software development, cloud, testing and data — taught by working industry experts.",
            "footer_text": "CloudWave Technologies Pvt Ltd — building tomorrow's technology professionals.",
            "stat_students": "5000", "stat_courses": "25", "stat_trainers": "40",
            "stat_placement": "92", "stat_experience": "10",
            "theme_mode": "auto",
            "updated_at": now_iso()})

    if await db.courses.count_documents({}) == 0:
        cats = ["Development", "Cloud", "Testing", "Data", "Programming"]
        courses = [
            ("Business Analyst", "Development", "Master requirement analysis, Agile, SQL, Power BI and stakeholder management.", "3 Months", 45000, 32000),
            ("Selenium with Java", "Testing", "Become an automation testing engineer with Selenium, Java, TestNG and frameworks.", "3 Months", 40000, 28000),
            ("AWS Solutions Architect", "Cloud", "Design and deploy scalable cloud infrastructure on Amazon Web Services.", "4 Months", 50000, 38000),
            ("Python Full Stack", "Programming", "Learn Python, Django, REST APIs, React and databases end-to-end.", "5 Months", 55000, 40000),
            ("Java Full Stack", "Programming", "Enterprise Java, Spring Boot, Microservices, React and deployment.", "5 Months", 55000, 42000),
            ("Data Analytics", "Data", "Excel, SQL, Python, Power BI and Tableau for data-driven careers.", "4 Months", 48000, 35000),
            ("Software Testing (Manual + Automation)", "Testing", "Complete QA journey from manual testing to automation frameworks.", "3 Months", 38000, 26000),
            ("DevOps Engineering", "Cloud", "CI/CD, Docker, Kubernetes, Jenkins, Terraform and cloud deployment.", "4 Months", 52000, 40000),
        ]
        levels = ["Beginner", "Intermediate", "Advanced"]
        for i, (name, cat, desc, dur, fee, disc) in enumerate(courses):
            await db.courses.insert_one({
                "id": new_id(), "slug": slugify(name), "name": name, "category": cat,
                "short_description": desc,
                "full_description": desc + " This programme blends live instructor-led sessions, real projects, resume preparation and dedicated placement support to make you job-ready.",
                "image_url": "", "duration": dur, "level": levels[i % 3],
                "mode": "Online / Classroom", "fee": fee, "discounted_fee": disc,
                "certification": "CloudWave Certified " + name.split()[0],
                "prerequisites": "Basic computer knowledge. No prior coding experience required.",
                "learning_outcomes": ["Job-ready practical skills", "Real-time industry projects",
                    "Interview preparation", "Recognised certification"],
                "career_opportunities": ["Software Engineer", "Consultant", "Analyst", "Team Lead"],
                "tools": ["Git", "VS Code", "Jira", "Postman"],
                "syllabus": [
                    {"module": "Module 1: Foundations", "topics": ["Introduction & setup", "Core concepts", "Hands-on basics"]},
                    {"module": "Module 2: Core Skills", "topics": ["Advanced concepts", "Live examples", "Assignments"]},
                    {"module": "Module 3: Projects", "topics": ["Real-world project", "Best practices", "Deployment"]},
                    {"module": "Module 4: Career Prep", "topics": ["Resume building", "Mock interviews", "Placement support"]},
                ],
                "featured": i < 4, "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        course_docs = await db.courses.find({}, {"_id": 0}).to_list(50)
        cmap = {c["name"]: c["id"] for c in course_docs}

        trainers = [
            ("Rahul Deshmukh", "Lead Automation Architect", "12+ years", ["Selenium", "Java", "TestNG", "CI/CD"]),
            ("Priya Nair", "Cloud & DevOps Mentor", "10+ years", ["AWS", "Docker", "Kubernetes", "Terraform"]),
            ("Amit Verma", "Full Stack Lead", "11+ years", ["Python", "Django", "React", "PostgreSQL"]),
            ("Sneha Kulkarni", "Data Analytics Expert", "9+ years", ["SQL", "Power BI", "Tableau", "Python"]),
            ("Vikram Singh", "Java Enterprise Trainer", "13+ years", ["Spring Boot", "Microservices", "Java", "AWS"]),
            ("Neha Sharma", "Business Analysis Coach", "8+ years", ["Agile", "SQL", "Power BI", "JIRA"]),
        ]
        for i, (nm, desig, exp, skills) in enumerate(trainers):
            await db.trainers.insert_one({
                "id": new_id(), "name": nm, "designation": desig, "experience": exp,
                "skills": skills, "certifications": ["Industry Certified Professional"],
                "bio": f"{nm} is a seasoned professional with {exp} of industry experience, having trained thousands of students into successful IT careers.",
                "photo_url": "", "linkedin": "https://linkedin.com",
                "active": True, "sort_order": i, "created_at": now_iso(), "updated_at": now_iso()})

        import datetime as _dt
        base = _dt.date.today()
        statuses = ["Upcoming", "Filling Fast", "Upcoming", "Started"]
        for i, (name, cid) in enumerate(list(cmap.items())[:5]):
            sd = base + _dt.timedelta(days=7 + i * 10)
            await db.batches.insert_one({
                "id": new_id(), "course_id": cid, "course_name": name,
                "start_date": sd.isoformat(), "end_date": (sd + _dt.timedelta(days=90)).isoformat(),
                "days": "Mon, Wed, Fri", "time": "7:00 PM - 9:00 PM",
                "trainer": trainers[i % len(trainers)][0], "mode": "Online",
                "seats": 30 - i * 3, "location": "Online / Pune Center",
                "status": statuses[i % len(statuses)], "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        testimonials = [
            ("Aarti Joshi", "Selenium with Java", 5, "The trainers are amazing and the placement support helped me land a QA job within a month of finishing."),
            ("Rohan Mehta", "AWS Solutions Architect", 5, "Hands-on cloud labs and real projects gave me the confidence to clear my AWS certification and interviews."),
            ("Kavya Reddy", "Data Analytics", 5, "From zero coding knowledge to a Data Analyst role — CloudWave changed my career completely."),
            ("Suresh Patil", "Java Full Stack", 4, "Excellent structured curriculum and very supportive mentors. Highly recommend for freshers."),
        ]
        for i, (nm, crs, rt, txt) in enumerate(testimonials):
            await db.testimonials.insert_one({
                "id": new_id(), "name": nm, "course": crs, "rating": rt, "text": txt,
                "photo_url": "", "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        faqs = [
            ("Courses", "Do I need prior experience to join?", "No. Most of our courses start from the fundamentals and are designed for both freshers and working professionals."),
            ("Fees", "Do you offer EMI or instalment options?", "Yes, we offer flexible instalment plans and early-bird discounts on most courses."),
            ("Batches", "Do you have weekend batches?", "Yes, we run weekday, weekend and fast-track batches in both online and classroom modes."),
            ("Certification", "Is the certificate recognised?", "You receive a CloudWave Technologies course completion certificate, and we prepare you for global vendor certifications."),
            ("Placement", "Do you guarantee placement?", "We provide dedicated placement assistance including resume building, mock interviews and interview referrals."),
            ("Training", "Are classes live or recorded?", "All classes are live and instructor-led. Recordings are provided for revision."),
        ]
        for i, (cat, q, a) in enumerate(faqs):
            await db.faqs.insert_one({"id": new_id(), "category": cat, "question": q, "answer": a,
                "published": True, "sort_order": i, "created_at": now_iso(), "updated_at": now_iso()})

        blogs = [
            ("Top 5 IT Skills to Learn in 2026", "Career", "The technology landscape keeps evolving. Here are the most in-demand skills that will boost your career this year — cloud computing, automation testing, data analytics, DevOps and full stack development."),
            ("How to Crack Your First Software Testing Interview", "Testing", "Landing your first QA role can feel overwhelming. In this guide we cover the key concepts, common questions and practical tips to help you succeed."),
            ("Why AWS Certification is Worth It in 2026", "Cloud", "Cloud skills are among the highest paid in IT. We break down why an AWS certification can accelerate your career and how to prepare effectively."),
        ]
        for i, (t, cat, content) in enumerate(blogs):
            await db.blog_posts.insert_one({
                "id": new_id(), "slug": slugify(t), "title": t, "category": cat,
                "author": "CloudWave Team", "excerpt": content[:140] + "...",
                "content": content + "\n\n" + content, "image_url": "",
                "tags": [cat, "IT", "Training"], "seo_title": t,
                "seo_description": content[:150], "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        placements = [
            ("Rahul Sharma", "TCS", "Software Test Engineer", "Selenium with Java", "2026"),
            ("Anjali Gupta", "Infosys", "Cloud Engineer", "AWS Solutions Architect", "2026"),
            ("Karan Mehta", "Wipro", "Data Analyst", "Data Analytics", "2025"),
            ("Pooja Iyer", "Accenture", "Full Stack Developer", "Python Full Stack", "2026"),
            ("Sagar Rao", "Cognizant", "Java Developer", "Java Full Stack", "2025"),
            ("Divya Menon", "Capgemini", "Business Analyst", "Business Analyst", "2026"),
        ]
        for i, (nm, comp, role, crs, yr) in enumerate(placements):
            await db.placements.insert_one({
                "id": new_id(), "student_name": nm, "company_name": comp, "job_title": role,
                "course": crs, "placement_year": yr, "placement_date": f"{yr}-0{(i%9)+1}-15",
                "story": f"{nm} completed the {crs} programme and successfully landed a {role} role at {comp}.",
                "student_photo": "", "company_logo": "", "linkedin_url": "https://linkedin.com",
                "featured": i < 3, "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        events = [
            ("AWS Cloud Workshop 2026", "Workshop", "A hands-on workshop covering real-world AWS deployment scenarios with industry experts."),
            ("Placement Drive - Selenium Batch", "Placement Drive", "Exclusive placement drive with 15+ hiring partners for our automation testing graduates."),
            ("Career Guidance Seminar", "Seminar", "Free seminar on building a successful IT career, resume tips and interview strategies."),
        ]
        for i, (t, cat, desc) in enumerate(events):
            await db.events.insert_one({
                "id": new_id(), "title": t, "category": cat, "description": desc,
                "event_date": (base + _dt.timedelta(days=15 + i * 12)).isoformat(),
                "location": "CloudWave Center, Pune", "cover_image": "",
                "gallery_images": [], "youtube_url": "", "instagram_url": "",
                "featured": i == 0, "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        videos = [
            ("Student Success Story - Selenium Batch", "Placements", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            ("AWS Training Demo Session", "Workshops", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            ("Institute Tour & Infrastructure", "Institute Events", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ]
        for i, (t, cat, url) in enumerate(videos):
            await db.videos.insert_one({
                "id": new_id(), "title": t, "category": cat, "video_url": url,
                "platform": "youtube", "thumbnail_url": "", "description": t,
                "featured": i < 2, "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

        gallery_cats = ["Student Placements", "Certificate Distribution", "Workshops",
                        "Seminars", "Annual Events", "Classroom Activities"]
        for i in range(6):
            await db.gallery.insert_one({
                "id": new_id(), "title": f"{gallery_cats[i]} 2026",
                "description": f"Highlights from our {gallery_cats[i].lower()}.",
                "image_url": "", "category": gallery_cats[i], "event_name": gallery_cats[i],
                "year": "2026", "event_date": "2026-01-15", "location": "Pune",
                "featured": i < 3, "published": True, "sort_order": i,
                "created_at": now_iso(), "updated_at": now_iso()})

    if await db.themes.count_documents({}) == 0:
        await db.themes.insert_one({
            "id": new_id(), "name": "Diwali Celebration", "type": "festival",
            "description": "Festive Diwali accent theme", "start_date": "2026-10-15",
            "end_date": "2026-11-05", "priority": 10, "primary_color": "#F59E0B",
            "secondary_color": "#B45309", "accent_color": "#F59E0B", "background": "",
            "banner_image": "", "decorative_image": "",
            "announcement_text": "🎉 Happy Diwali from CloudWave Technologies! Special admission offers this festive season.",
            "cta_text": "View Celebration Photos", "cta_url": "/gallery",
            "animation_enabled": True, "is_active": True, "sort_order": 0,
            "created_at": now_iso(), "updated_at": now_iso()})
        await db.themes.insert_one({
            "id": new_id(), "name": "New Batch Admission Campaign", "type": "admission_campaign",
            "description": "Admissions open promo", "start_date": "", "end_date": "",
            "priority": 5, "primary_color": "#1D4ED8", "secondary_color": "#4F46E5",
            "accent_color": "#F97316", "background": "", "banner_image": "", "decorative_image": "",
            "announcement_text": "🚀 New batches starting soon! Limited seats — Enquire now for early-bird discounts.",
            "cta_text": "Explore Courses", "cta_url": "/courses",
            "animation_enabled": False, "is_active": True, "sort_order": 1,
            "created_at": now_iso(), "updated_at": now_iso()})


@app.on_event("shutdown")
async def shutdown():
    client.close()
