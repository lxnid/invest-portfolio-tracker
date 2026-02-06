"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-zinc-950">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
          }}
        />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-violet-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 md:w-64 md:h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm mb-8 animate-fade-in">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-zinc-400">
            Track your CSE investments with precision
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-7xl font-bold text-zinc-50 mb-6 animate-fade-in-up">
          One portfolio.
          <br />
          <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
            Zero guesswork.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 animate-fade-in-up-delayed px-4">
          A personal investment tracker built for the Colombo Stock Exchange.
          Real-time data, smart analytics, and trading discipline — all in one
          place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delayed-2">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl border border-zinc-800 transition-all duration-200"
          >
            Try Guest Demo
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-zinc-800/50 animate-fade-in-up-delayed-3">
          <p className="text-sm text-zinc-500 mb-4">
            Built with modern technologies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-zinc-600 px-4">
            <span className="text-xs font-medium whitespace-nowrap">
              Next.js
            </span>
            <span className="text-zinc-800 hidden md:inline">•</span>
            <span className="text-xs font-medium whitespace-nowrap">
              TypeScript
            </span>
            <span className="text-zinc-800 hidden md:inline">•</span>
            <span className="text-xs font-medium whitespace-nowrap">
              TradingView
            </span>
            <span className="text-zinc-800 hidden md:inline">•</span>
            <span className="text-xs font-medium whitespace-nowrap">
              Cloudflare
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-zinc-500 rounded-full animate-scroll-indicator" />
        </div>
      </div>
    </section>
  );
}
