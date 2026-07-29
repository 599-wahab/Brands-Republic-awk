import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

const statuses = new Set(["Returning", "One-time", "Abandoned cart", "Needs review"]);
const entities = new Set(["interaction", "reminder", "feedback", "revenue"]);

function db() {
  if (!env.DB) throw new Error("CRM database is not available");
  return env.DB;
}

async function actor() {
  const user = await getChatGPTUser();
  if (user) return user.email;
  if (process.env.NODE_ENV !== "production") return "local@brandsrepublic.dev";
  return null;
}

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected CRM error";
  const missing = message.includes("no such table");
  return Response.json({ error: missing ? "The CRM database migration has not been applied." : message }, { status: 500 });
}

export async function GET() {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const database = db();
    const [customers, interactions, reminders, feedback, revenue] = await Promise.all([
      database.prepare("SELECT * FROM customers WHERE archived_at IS NULL ORDER BY updated_at DESC").all(),
      database.prepare("SELECT * FROM interactions ORDER BY happened_at DESC").all(),
      database.prepare("SELECT * FROM reminders ORDER BY completed ASC, due_at ASC").all(),
      database.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all(),
      database.prepare("SELECT * FROM revenue ORDER BY occurred_at DESC").all(),
    ]);
    return Response.json({ customers: customers.results, interactions: interactions.results, reminders: reminders.results, feedback: feedback.results, revenue: revenue.results });
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
      await database.prepare("INSERT INTO customers (id,name,email,phone,location,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(id, name, email, clean(payload.phone, 50), clean(payload.location, 120), status, now, now).run();
      return Response.json({ id }, { status: 201 });
    }

    if (!entities.has(entity)) return Response.json({ error: "Unsupported CRM entity" }, { status: 400 });
    const customerId = clean(payload.customerId, 80);
    if (!customerId) return Response.json({ error: "Customer is required" }, { status: 400 });

    if (entity === "interaction") {
      const summary = clean(payload.summary, 180);
      if (!summary) return Response.json({ error: "Conversation summary is required" }, { status: 400 });
      await database.prepare("INSERT INTO interactions (id,customer_id,channel,summary,remarks,sentiment,happened_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
        .bind(id, customerId, clean(payload.channel, 30) || "Call", summary, clean(payload.remarks, 1200), clean(payload.sentiment, 20) || "Neutral", clean(payload.happenedAt, 40) || now, currentActor, now).run();
    }
    if (entity === "reminder") {
      const title = clean(payload.title, 180); const dueAt = clean(payload.dueAt, 40);
      if (!title || !dueAt) return Response.json({ error: "Reminder title and due date are required" }, { status: 400 });
      await database.prepare("INSERT INTO reminders (id,customer_id,title,due_at,priority,completed,created_by,created_at) VALUES (?,?,?,?,?,0,?,?)")
        .bind(id, customerId, title, dueAt, clean(payload.priority, 20) || "Normal", currentActor, now).run();
    }
    if (entity === "feedback") {
      const rating = Number(payload.rating); const comment = clean(payload.comment, 1200);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return Response.json({ error: "Feedback needs a 1–5 rating and comment" }, { status: 400 });
      await database.prepare("INSERT INTO feedback (id,customer_id,rating,category,comment,status,created_at) VALUES (?,?,?,?,?,'Open',?)")
        .bind(id, customerId, rating, clean(payload.category, 50) || "General", comment, now).run();
    }
    if (entity === "revenue") {
      const amountPence = Math.round(Number(payload.amount) * 100);
      if (!Number.isFinite(amountPence) || amountPence <= 0) return Response.json({ error: "Revenue amount must be greater than zero" }, { status: 400 });
      await database.prepare("INSERT INTO revenue (id,customer_id,amount_pence,type,reference,note,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(id, customerId, amountPence, clean(payload.type, 40) || "Order", clean(payload.reference, 80), clean(payload.note, 500), clean(payload.occurredAt, 40) || now, now).run();
    }
    await database.prepare("UPDATE customers SET updated_at=? WHERE id=?").bind(now, customerId).run();
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
    if (entity === "reminder") await db().prepare("UPDATE reminders SET completed=?, completed_at=? WHERE id=?").bind(payload.completed ? 1 : 0, payload.completed ? now : null, id).run();
    else if (entity === "feedback") await db().prepare("UPDATE feedback SET status=? WHERE id=?").bind(clean(payload.status, 20) || "Resolved", id).run();
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
    await db().prepare("UPDATE customers SET archived_at=?, updated_at=? WHERE id=?").bind(new Date().toISOString(), new Date().toISOString(), id).run();
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
