import { Metadata } from "next";
import { ResetPasswordView } from "@/components/views/reset-password-view";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new portfolio tracker password.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
