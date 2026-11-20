import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; confirmed?: string; error?: string }> }) {
  const sp = await searchParams;
  const notice = sp.confirmed ? "Email confirmed — you can log in now." : sp.error ? "That link is invalid or expired. Try logging in or sign up again." : undefined;
  return <LoginForm next={sp.next} notice={notice} />;
}
