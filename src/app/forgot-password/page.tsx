import { Metadata } from "next";
import { ForgotPasswordView } from "@/components/views/forgot-password-view";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your portfolio tracker password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
