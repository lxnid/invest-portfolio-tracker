"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function DemoPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = Math.min(
          Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0),
          1,
        );
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-4">
            See it in action.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            A clean, professional interface designed for serious investors. No
            clutter, just insights.
          </p>
        </div>

        {/* Device mockup */}
        <div
          className={`relative transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
          }`}
          style={{
            transform: `perspective(1000px) rotateX(${5 - scrollProgress * 10}deg)`,
          }}
        >
          {/* Desktop frame */}
          <div className="relative mx-auto max-w-4xl">
            {/* Browser chrome */}
            <div className="bg-zinc-800 rounded-t-xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-400 text-center">
                  portfolio.dinilr.com
                </div>
              </div>
            </div>

            {/* Screenshot container */}
            <div className="relative bg-zinc-900 rounded-b-xl overflow-hidden border-x border-b border-zinc-700 shadow-2xl">
              {/* Glassmorphism overlay on edges */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
              </div>

              {/* App screenshot */}
              <div className="relative aspect-[16/10]">
                <Image
                  src="/demo.png"
                  alt="CSE Portfolio Tracker Dashboard"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Floating elements for depth */}
            <div
              className="absolute -left-8 top-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
              style={{
                transform: `translateY(${scrollProgress * 30}px)`,
              }}
            />
            <div
              className="absolute -right-8 bottom-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
              style={{
                transform: `translateY(${-scrollProgress * 40}px)`,
              }}
            />
          </div>
        </div>

        {/* Feature callouts */}
        <div
          className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: "Real-time", label: "Market Data" },
            { value: "100%", label: "CSE Coverage" },
            { value: "Edge", label: "Deployed" },
            { value: "Free", label: "Guest Mode" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
            >
              <div className="text-2xl font-bold text-zinc-50 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
