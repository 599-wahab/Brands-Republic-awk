import { getAuthenticatedUser } from "@/app/auth";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const statuses = new Set(["Returning", "One-time", "Abandoned cart", "Needs review"]);
const entities = new Set(["interaction", "reminder", "feedback", "revenue"]);

function db() {
  return getDb();
}

async function actor() {
  const user = await getAuthenticatedUser();
  if (user) return user.email;
  return null;
}

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected CRM error";
  const missing = message.includes("does not exist") || message.includes("DATABASE_URL");
  console.error("CRM database operation failed", error);
  return Response.json({ error: missing ? "The CRM database is not configured yet." : "The CRM database request failed." }, { status: 500 });
}

export async function GET() {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const database = db();
    const [customers, interactions, reminders, feedback, revenue] = await Promise.all([
      database.query("SELECT id,name,email,phone,location,status,created_at,updated_at FROM customers WHERE archived_at IS NULL ORDER BY updated_at DESC", []),
      database.query("SELECT interactions.* FROM interactions JOIN customers ON customers.id=interactions.customer_id WHERE customers.archived_at IS NULL ORDER BY happened_at DESC", []),
      database.query("SELECT reminders.* FROM reminders JOIN customers ON customers.id=reminders.customer_id WHERE customers.archived_at IS NULL ORDER BY completed ASC, due_at ASC", []),
      database.query("SELECT feedback.* FROM feedback JOIN customers ON customers.id=feedback.customer_id WHERE customers.archived_at IS NULL ORDER BY created_at DESC", []),
      database.query("SELECT revenue.* FROM revenue JOIN customers ON customers.id=revenue.customer_id WHERE customers.archived_at IS NULL ORDER BY occurred_at DESC", []),
    ]);
    return Response.json({ customers, interactions, reminders, feedback, revenue });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const payload = await request.json() as Record<string, unknown>;
    const entity = clean(payload.entity, 30);
    const database = db();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (entity === "customer") {
      const name = clean(payload.name, 120); const email = clean(payload.email, 180).toLowerCase();
      const status = clean(payload.status, 30);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !statuses.has(status)) return Response.json({ error: "Valid name, email, and status are required" }, { status: 400 });
      await database.query("INSERT INTO customers (id,name,email,phone,location,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, name, email, clean(payload.phone, 50), clean(payload.location, 120), status, now, now]);
      return Response.json({ id }, { status: 201 });
    }

    if (!entities.has(entity)) return Response.json({ error: "Unsupported CRM entity" }, { status: 400 });
    const customerId = clean(payload.customerId, 80);
    if (!customerId) return Response.json({ error: "Customer is required" }, { status: 400 });

    if (entity === "interaction") {
      const summary = clean(payload.summary, 180);
      if (!summary) return Response.json({ error: "Conversation summary is required" }, { status: 400 });
      await database.query("INSERT INTO interactions (id,customer_id,channel,summary,remarks,sentiment,happened_at,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [id, customerId, clean(payload.channel, 30) || "Call", summary, clean(payload.remarks, 1200), clean(payload.sentiment, 20) || "Neutral", clean(payload.happenedAt, 40) || now, currentActor, now]);
    }
    if (entity === "reminder") {
      const title = clean(payload.title, 180); const dueAt = clean(payload.dueAt, 40);
      if (!title || !dueAt) return Response.json({ error: "Reminder title and due date are required" }, { status: 400 });
      await database.query("INSERT INTO reminders (id,customer_id,title,due_at,priority,completed,created_by,created_at) VALUES ($1,$2,$3,$4,$5,FALSE,$6,$7)",
        [id, customerId, title, dueAt, clean(payload.priority, 20) || "Normal", currentActor, now]);
    }
    if (entity === "feedback") {
      const rating = Number(payload.rating); const comment = clean(payload.comment, 1200);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return Response.json({ error: "Feedback needs a 1–5 rating and comment" }, { status: 400 });
      await database.query("INSERT INTO feedback (id,customer_id,rating,category,comment,status,created_at) VALUES ($1,$2,$3,$4,$5,'Open',$6)",
        [id, customerId, rating, clean(payload.category, 50) || "General", comment, now]);
    }
    if (entity === "revenue") {
      const amountPence = Math.round(Number(payload.amount) * 100);
      if (!Number.isFinite(amountPence) || amountPence <= 0) return Response.json({ error: "Revenue amount must be greater than zero" }, { status: 400 });
      await database.query("INSERT INTO revenue (id,customer_id,amount_pence,type,reference,note,occurred_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, customerId, amountPence, clean(payload.type, 40) || "Order", clean(payload.reference, 80), clean(payload.note, 500), clean(payload.occurredAt, 40) || now, now]);
    }
    await database.query("UPDATE customers SET updated_at=$1 WHERE id=$2", [now, customerId]);
    return Response.json({ id }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const payload = await request.json() as Record<string, unknown>;
    const entity = clean(payload.entity, 30); const id = clean(payload.id, 80); const now = new Date().toISOString();
    if (!id) return Response.json({ error: "Record id is required" }, { status: 400 });
    if (entity === "reminder") await db().query("UPDATE reminders SET completed=$1, completed_at=$2 WHERE id=$3", [Boolean(payload.completed), payload.completed ? now : null, id]);
    else if (entity === "feedback") await db().query("UPDATE feedback SET status=$1 WHERE id=$2", [clean(payload.status, 20) || "Resolved", id]);
    else return Response.json({ error: "Unsupported update" }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id")?.slice(0, 80);
    if (!id) return Response.json({ error: "Customer id is required" }, { status: 400 });
    const now = new Date().toISOString();
    await db().query("UPDATE customers SET archived_at=$1, updated_at=$1 WHERE id=$2", [now, id]);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
