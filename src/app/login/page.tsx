"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (type: "admin" | "guest") => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, type }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Invalid password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#f5f5f5]">
            Access Portfolio
          </CardTitle>
          <p className="text-[#8a8a8a] text-sm mt-1">
            Personal Investment Tracker
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Login */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#a8a8a8]">
                Admin Access
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#666]" />
                <Input
                  type="password"
                  placeholder="Enter Admin Password"
                  className="pl-9 bg-[#262626] border-[#333] text-[#f5f5f5]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb]"
              onClick={() => handleLogin("admin")}
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : "Login to Admin"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#333]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a1a] px-2 text-[#666]">Or Try Demo</span>
            </div>
          </div>

          {/* Guest Login */}
          <Button
            variant="outline"
            className="w-full border-[#333] text-[#f5f5f5] hover:bg-[#262626]"
            onClick={() => handleLogin("guest")}
            disabled={isLoading}
          >
            <User className="mr-2 h-4 w-4" />
            Continue as Guest (Demo)
          </Button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
