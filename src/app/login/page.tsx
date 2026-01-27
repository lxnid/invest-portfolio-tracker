import { Metadata } from "next";
import { LoginView } from "@/components/views/login-view";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Secure login to access your personal investment portfolio tracker.",
};

export default function LoginPage() {
  return <LoginView />;
}
