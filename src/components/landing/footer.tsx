import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { APP_NAME, AUTHOR_NAME, AUTHOR_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative py-12 px-6 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-semibold text-zinc-300">{APP_NAME}</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link
              href="/login"
              className="hover:text-zinc-300 transition-colors"
            >
              Login
            </Link>
            <span className="text-zinc-700">•</span>
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              About
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()}{" "}
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              {AUTHOR_NAME}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
