import Dashboard from "./dashboard";
import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

async function AuthenticatedDashboard() {
  const optionalUser = await getChatGPTUser();
  const user = optionalUser ?? (process.env.NODE_ENV === "production" ? await requireChatGPTUser("/") : null);
  return <Dashboard userName={user?.displayName ?? "Adnan"} userEmail={user?.email ?? "local@brandsrepublic.dev"} />;
}

export default function Page() {
  return <AuthenticatedDashboard />;
}
