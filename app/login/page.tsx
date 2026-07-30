import { LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, passwordLoginConfigured } from "@/app/auth";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  invalid: "The login ID or password is incorrect.",
  locked: "Too many attempts. Please wait 15 minutes and try again.",
  configuration: "Login is not configured yet. Add the required environment variables.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAuthenticatedUser()) redirect("/");
  const { error } = await searchParams;
  const configured = passwordLoginConfigured();

  return <main className="login-page">
    <div className="login-artwork" aria-hidden="true"/>
    <div className="login-shade" aria-hidden="true"/>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand"><span>BR</span><div><b>Brands Republic</b><small>Customer Relationship Hub</small></div></div>
      <div className="login-lock"><LockKeyhole size={22}/></div>
      <p className="login-eyebrow">SECURE WORKSPACE</p>
      <h1 id="login-title">Welcome back</h1>
      <p className="login-intro">Sign in to manage customer conversations, follow-ups, feedback, and revenue.</p>
      {(error || !configured) && <div className="login-error" role="alert">{messages[error || "configuration"] || messages.invalid}</div>}
      <form action="/api/auth/login" method="post" className="login-form">
        <label><span>Login ID</span><input name="loginId" autoComplete="username" required autoFocus placeholder="Enter your login ID"/></label>
        <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required placeholder="Enter your password"/></label>
        <button type="submit" disabled={!configured}>Sign in securely</button>
      </form>
      <div className="login-security"><ShieldCheck size={16}/><span><b>Protected access</b><small>Your credentials are checked securely on the server.</small></span></div>
    </section>
  </main>;
}
