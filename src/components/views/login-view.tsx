"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";

export function LoginView() {
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-zinc-50">
            Access Portfolio
          </CardTitle>
          <p className="text-zinc-500 text-sm mt-1">
            Personal Investment Tracker
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Login */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Admin Access
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="Enter Admin Password"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleLogin("admin")}
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : "Login to Admin"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">
                Or Try Demo
              </span>
            </div>
          </div>

          {/* Guest Login */}
          <Button
            variant="outline"
            className="w-full border-zinc-800 text-zinc-50 hover:bg-zinc-800"
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
