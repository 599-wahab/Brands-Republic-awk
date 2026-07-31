import { getAuthenticatedUser } from "@/app/auth";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const statuses = new Set(["Returning", "One-time", "Abandoned cart", "Needs review"]);
const entities = new Set(["interaction", "reminder", "feedback", "revenue"]);
const channels = new Set(["Call", "Email", "WhatsApp", "Meeting", "In person"]);
const sentiments = new Set(["Positive", "Neutral", "Negative"]);
const priorities = new Set(["Low", "Normal", "High"]);
const feedbackStatuses = new Set(["Open", "Resolved"]);

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

function wholeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function dateTime(value: unknown) {
  const result = clean(value, 40);
  return result && !Number.isNaN(Date.parse(result)) ? result : "";
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
      database.query("SELECT id,name,email,phone,location,full_address,city,country,postal_code,order_count,cart_count,missing_fields,import_source,status,created_at,updated_at FROM customers WHERE archived_at IS NULL ORDER BY updated_at DESC", []),
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
      const orderCount = wholeNumber(payload.orderCount); const cartCount = wholeNumber(payload.cartCount);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !statuses.has(status)) return Response.json({ error: "Valid name, email, and status are required" }, { status: 400 });
      if (orderCount === null || cartCount === null) return Response.json({ error: "Order and cart counts must be whole numbers" }, { status: 400 });
      const city = clean(payload.city, 120); const country = clean(payload.country, 120); const postalCode = clean(payload.postalCode, 40);
      const location = clean(payload.location, 220) || [city, country, postalCode].filter(Boolean).join(", ");
      await database.query("INSERT INTO customers (id,name,email,phone,location,full_address,city,country,postal_code,order_count,cart_count,missing_fields,import_source,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
        [id, name, email, clean(payload.phone, 50), location, clean(payload.fullAddress, 500), city, country, postalCode, orderCount, cartCount, clean(payload.missingFields, 500), "Manual entry", status, now, now]);
      return Response.json({ id }, { status: 201 });
    }

    if (!entities.has(entity)) return Response.json({ error: "Unsupported CRM entity" }, { status: 400 });
    const customerId = clean(payload.customerId, 80);
    if (!customerId) return Response.json({ error: "Customer is required" }, { status: 400 });
    const activeCustomer = await database.query("SELECT id FROM customers WHERE id=$1 AND archived_at IS NULL", [customerId]);
    if (!activeCustomer.length) return Response.json({ error: "Choose a valid active customer" }, { status: 400 });

    if (entity === "interaction") {
      const summary = clean(payload.summary, 180); const channel = clean(payload.channel, 30) || "Call"; const sentiment = clean(payload.sentiment, 20) || "Neutral"; const happenedAt = dateTime(payload.happenedAt) || now;
      if (!summary || !channels.has(channel) || !sentiments.has(sentiment)) return Response.json({ error: "A valid conversation summary, channel, and sentiment are required" }, { status: 400 });
      await database.query("INSERT INTO interactions (id,customer_id,channel,summary,remarks,sentiment,happened_at,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [id, customerId, channel, summary, clean(payload.remarks, 1200), sentiment, happenedAt, currentActor, now]);
    }
    if (entity === "reminder") {
      const title = clean(payload.title, 180); const dueAt = dateTime(payload.dueAt); const priority = clean(payload.priority, 20) || "Normal";
      if (!title || !dueAt || !priorities.has(priority)) return Response.json({ error: "Reminder title, due date, and priority are required" }, { status: 400 });
      await database.query("INSERT INTO reminders (id,customer_id,title,due_at,priority,completed,created_by,created_at) VALUES ($1,$2,$3,$4,$5,FALSE,$6,$7)",
        [id, customerId, title, dueAt, priority, currentActor, now]);
    }
    if (entity === "feedback") {
      const rating = Number(payload.rating); const comment = clean(payload.comment, 1200);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return Response.json({ error: "Feedback needs a 1–5 rating and comment" }, { status: 400 });
      await database.query("INSERT INTO feedback (id,customer_id,rating,category,comment,status,created_at) VALUES ($1,$2,$3,$4,$5,'Open',$6)",
        [id, customerId, rating, clean(payload.category, 50) || "General", comment, now]);
    }
    if (entity === "revenue") {
      const amountPence = Math.round(Number(payload.amount) * 100); const occurredAt = dateTime(payload.occurredAt) || now;
      if (!Number.isFinite(amountPence) || amountPence <= 0) return Response.json({ error: "Revenue amount must be greater than zero" }, { status: 400 });
      await database.query("INSERT INTO revenue (id,customer_id,amount_pence,type,reference,note,occurred_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, customerId, amountPence, clean(payload.type, 40) || "Order", clean(payload.reference, 80), clean(payload.note, 500), occurredAt, now]);
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
    const entity = clean(payload.entity, 30); const id = clean(payload.id, 80); const now = new Date().toISOString(); const database = db();
    if (!id) return Response.json({ error: "Record id is required" }, { status: 400 });
    const requestedCustomerId = clean(payload.customerId, 80);
    if (entity !== "customer" && requestedCustomerId) {
      const activeCustomer = await database.query("SELECT id FROM customers WHERE id=$1 AND archived_at IS NULL", [requestedCustomerId]);
      if (!activeCustomer.length) return Response.json({ error: "Choose a valid active customer" }, { status: 400 });
    }

    let updated: Array<Record<string, unknown>> = [];
    if (entity === "customer") {
      const name = clean(payload.name, 120); const email = clean(payload.email, 180).toLowerCase(); const status = clean(payload.status, 30);
      const orderCount = wholeNumber(payload.orderCount); const cartCount = wholeNumber(payload.cartCount);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !statuses.has(status)) return Response.json({ error: "Valid name, email, and status are required" }, { status: 400 });
      if (orderCount === null || cartCount === null) return Response.json({ error: "Order and cart counts must be whole numbers" }, { status: 400 });
      const city = clean(payload.city, 120); const country = clean(payload.country, 120); const postalCode = clean(payload.postalCode, 40);
      const location = clean(payload.location, 220) || [city, country, postalCode].filter(Boolean).join(", ");
      updated = await database.query("UPDATE customers SET name=$1,email=$2,phone=$3,location=$4,full_address=$5,city=$6,country=$7,postal_code=$8,order_count=$9,cart_count=$10,missing_fields=$11,status=$12,updated_at=$13 WHERE id=$14 AND archived_at IS NULL RETURNING id",
        [name, email, clean(payload.phone, 50), location, clean(payload.fullAddress, 500), city, country, postalCode, orderCount, cartCount, clean(payload.missingFields, 500), status, now, id]);
    } else if (entity === "interaction") {
      const summary = clean(payload.summary, 180); const channel = clean(payload.channel, 30); const sentiment = clean(payload.sentiment, 20); const happenedAt = dateTime(payload.happenedAt);
      if (!summary || !channels.has(channel) || !sentiments.has(sentiment) || !happenedAt) return Response.json({ error: "A valid conversation summary, channel, sentiment, and date are required" }, { status: 400 });
      updated = await database.query("UPDATE interactions SET customer_id=COALESCE(NULLIF($1,''),customer_id),channel=$2,summary=$3,remarks=$4,sentiment=$5,happened_at=$6 WHERE id=$7 RETURNING id,customer_id", [requestedCustomerId, channel, summary, clean(payload.remarks, 1200), sentiment, happenedAt, id]);
    } else if (entity === "reminder" && Object.hasOwn(payload, "title")) {
      const title = clean(payload.title, 180); const dueAt = dateTime(payload.dueAt); const priority = clean(payload.priority, 20);
      if (!title || !dueAt || !priorities.has(priority)) return Response.json({ error: "Reminder title, due date, and priority are required" }, { status: 400 });
      updated = await database.query("UPDATE reminders SET customer_id=COALESCE(NULLIF($1,''),customer_id),title=$2,due_at=$3,priority=$4 WHERE id=$5 RETURNING id,customer_id", [requestedCustomerId, title, dueAt, priority, id]);
    } else if (entity === "reminder") {
      const completed = Boolean(payload.completed);
      updated = await database.query("UPDATE reminders SET completed=$1,completed_at=$2 WHERE id=$3 RETURNING id,customer_id", [completed, completed ? now : null, id]);
    } else if (entity === "feedback" && Object.hasOwn(payload, "comment")) {
      const rating = Number(payload.rating); const comment = clean(payload.comment, 1200); const status = clean(payload.status, 20) || "Open";
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment || !feedbackStatuses.has(status)) return Response.json({ error: "Feedback needs a 1–5 rating, comment, and valid status" }, { status: 400 });
      updated = await database.query("UPDATE feedback SET customer_id=COALESCE(NULLIF($1,''),customer_id),rating=$2,category=$3,comment=$4,status=$5 WHERE id=$6 RETURNING id,customer_id", [requestedCustomerId, rating, clean(payload.category, 50) || "General", comment, status, id]);
    } else if (entity === "feedback") {
      const status = clean(payload.status, 20) || "Resolved";
      if (!feedbackStatuses.has(status)) return Response.json({ error: "Unsupported feedback status" }, { status: 400 });
      updated = await database.query("UPDATE feedback SET status=$1 WHERE id=$2 RETURNING id,customer_id", [status, id]);
    } else if (entity === "revenue") {
      const amountPence = Math.round(Number(payload.amount) * 100); const occurredAt = dateTime(payload.occurredAt);
      if (!Number.isFinite(amountPence) || amountPence <= 0 || !occurredAt) return Response.json({ error: "Revenue amount and date are required" }, { status: 400 });
      updated = await database.query("UPDATE revenue SET customer_id=COALESCE(NULLIF($1,''),customer_id),amount_pence=$2,type=$3,reference=$4,note=$5,occurred_at=$6 WHERE id=$7 RETURNING id,customer_id", [requestedCustomerId, amountPence, clean(payload.type, 40) || "Order", clean(payload.reference, 80), clean(payload.note, 500), occurredAt, id]);
    } else return Response.json({ error: "Unsupported update" }, { status: 400 });

    if (!updated.length) return Response.json({ error: "Record not found" }, { status: 404 });
    const customerId = clean(updated[0].customer_id, 80);
    if (customerId) await database.query("UPDATE customers SET updated_at=$1 WHERE id=$2", [now, customerId]);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  const currentActor = await actor();
  if (!currentActor) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const url = new URL(request.url); const entity = clean(url.searchParams.get("entity"), 30) || "customer"; const id = clean(url.searchParams.get("id"), 80);
    if (!id) return Response.json({ error: "Record id is required" }, { status: 400 });
    const now = new Date().toISOString();
    const database = db();
    if (entity === "customer") {
      const archived = await database.query("UPDATE customers SET archived_at=$1,updated_at=$1 WHERE id=$2 AND archived_at IS NULL RETURNING id", [now, id]);
      if (!archived.length) return Response.json({ error: "Customer not found" }, { status: 404 });
      return Response.json({ ok: true, archived: true });
    }
    const tables: Record<string, string> = { interaction: "interactions", reminder: "reminders", feedback: "feedback", revenue: "revenue" };
    const table = tables[entity];
    if (!table) return Response.json({ error: "Unsupported CRM entity" }, { status: 400 });
    const deleted = await database.query(`DELETE FROM ${table} WHERE id=$1 RETURNING customer_id`, [id]);
    if (!deleted.length) return Response.json({ error: "Record not found" }, { status: 404 });
    await database.query("UPDATE customers SET updated_at=$1 WHERE id=$2", [now, deleted[0].customer_id]);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
