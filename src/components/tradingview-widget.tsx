"use client";

import React, { useEffect, useRef, memo } from "react";

// Add declaration for the TradingView global
declare global {
  interface Window {
    TradingView: any;
  }
}

export type Theme = "light" | "dark";

interface TradingViewWidgetProps {
  symbol: string;
  theme?: Theme;
  className?: string;
  autosize?: boolean;
  interval?: string;
  timezone?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  hide_side_toolbar?: boolean;
}

function TradingViewWidgetComponent({
  symbol,
  theme = "dark",
  className,
  autosize = true,
  interval = "D",
  timezone = "Asia/Colombo",
  style = "1",
  locale = "en",
  toolbar_bg = "#f1f3f6",
  enable_publishing = false,
  allow_symbol_change = false,
  container_id = "tradingview_widget",
  hide_side_toolbar = false,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a unique ID for this instance if not provided effectively
    // But for now we rely on the containerRef and dynamic ID if we want multiple
    const uniqueId =
      container_id + "_" + Math.random().toString(36).substring(7);
    if (containerRef.current) {
      containerRef.current.id = uniqueId;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: autosize,
          // width: autosize ? undefined : 980,
          // height: autosize ? undefined : 610,
          symbol: symbol,
          interval: interval,
          timezone: timezone,
          theme: theme,
          style: style,
          locale: locale,
          toolbar_bg: toolbar_bg,
          enable_publishing: enable_publishing,
          allow_symbol_change: allow_symbol_change,
          container_id: uniqueId,
          hide_side_toolbar: hide_side_toolbar,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if needed, though usually fine to leave cached
      document.head.removeChild(script);
    };
  }, [
    symbol,
    theme,
    autosize,
    interval,
    timezone,
    style,
    locale,
    toolbar_bg,
    enable_publishing,
    allow_symbol_change,
    container_id,
    hide_side_toolbar,
  ]);

  return (
    <div
      className={`tradingview-widget-container ${className}`}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        id={container_id}
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

export const TradingViewWidget = memo(TradingViewWidgetComponent);
