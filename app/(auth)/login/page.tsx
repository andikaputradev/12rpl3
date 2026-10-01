import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;
  const safeRedirect = redirectTo?.startsWith("/") ? redirectTo : undefined;

  return <LoginForm redirectTo={safeRedirect} />;
}
