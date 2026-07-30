import { cookies } from "next/headers";
import { getChatGPTUser } from "./chatgpt-auth";

const SESSION_COOKIE = "br_crm_session";
const SESSION_HOURS = 8;

export type AuthenticatedUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  source: "chatgpt" | "password";
};

function configuredCredentials() {
  const loginId = process.env.CRM_LOGIN_ID?.trim() || "";
  const password = process.env.CRM_LOGIN_PASSWORD || "";
  const secret = process.env.CRM_SESSION_SECRET || "";
  return {
    loginId,
    password,
    secret,
    displayName: process.env.CRM_LOGIN_NAME?.trim() || "Brands Republic Admin",
    email: process.env.CRM_LOGIN_EMAIL?.trim() || (loginId.includes("@") ? loginId : "operations@brandsrepublic.co.uk"),
    configured: Boolean(loginId && password.length >= 12 && secret.length >= 32),
  };
}

export function passwordLoginConfigured() {
  return configuredCredentials().configured;
}

export async function verifyPasswordCredentials(loginId: string, password: string) {
  const configured = configuredCredentials();
  if (!configured.configured) return false;
  const [idMatches, passwordMatches] = await Promise.all([
    constantTimeEqual(loginId.trim().toLowerCase(), configured.loginId.toLowerCase()),
    constantTimeEqual(password, configured.password),
  ]);
  return idMatches && passwordMatches;
}

export async function createPasswordSession() {
  const configured = configuredCredentials();
  if (!configured.configured) throw new Error("Password login is not configured");
  const payload = encodeJson({ sub: configured.loginId, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 });
  const signature = await sign(payload, configured.secret);
  return `${payload}.${signature}`;
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function sessionCookieMaxAge() {
  return SESSION_HOURS * 60 * 60;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) return { ...chatGPTUser, source: "chatgpt" };

  const configured = configuredCredentials();
  if (!configured.configured) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !(await verifySession(token, configured.loginId, configured.secret))) return null;
  return { displayName: configured.displayName, email: configured.email, fullName: configured.displayName, source: "password" };
}

async function verifySession(token: string, loginId: string, secret: string) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = await sign(payload, secret);
  if (!(await constantTimeEqual(signature, expected))) return false;
  try {
    const parsed = decodeJson(payload) as { sub?: string; exp?: number };
    return parsed.sub === loginId && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

async function sign(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

function encodeJson(value: unknown) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
