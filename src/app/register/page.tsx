import { Metadata } from "next";
import { RegisterView } from "@/components/views/register-view";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your portfolio tracker account to start tracking your investments.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
