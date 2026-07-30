import Dashboard from "./dashboard";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "./auth";

export const dynamic = "force-dynamic";

async function AuthenticatedDashboard() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return <Dashboard userName={user.displayName} userEmail={user.email} signOutUrl={user.source === "chatgpt" ? "/signout-with-chatgpt?return_to=/" : "/api/auth/logout"} />;
}

export default function Page() {
  return <AuthenticatedDashboard />;
}
