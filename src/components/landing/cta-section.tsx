"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-32 px-6 overflow-hidden"
    >
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-blue-950/20 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-3xl opacity-50 md:opacity-100" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Start tracking today</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 mb-6">
            Ready to take control of your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              investment journey?
            </span>
          </h2>

          {/* Description */}
          <p className="text-base md:text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Join the CSE Portfolio Tracker and gain clarity on your portfolio.
            No complex setup — just log in and start tracking.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-medium rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Get Started Free</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-zinc-300 font-medium rounded-xl border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200"
            >
              Try Guest Demo
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-8 text-sm text-zinc-600">
            No credit card required • Guest mode available
          </p>
        </div>
      </div>
    </section>
  );
}
