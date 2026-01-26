"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizableDivProps extends React.HTMLAttributes<HTMLDivElement> {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}

export function ResizableDiv({
  children,
  className,
  minHeight = 400,
  maxHeight = 1200,
  defaultHeight = 800,
  ...props
}: ResizableDivProps) {
  const [height, setHeight] = useState(defaultHeight);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startY.current = e.clientY;
      startHeight.current = height;

      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";

      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    },
    [height],
  );

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      const delta = e.clientY - startY.current;
      const newHeight = Math.min(
        Math.max(startHeight.current + delta, minHeight),
        maxHeight,
      );

      setHeight(newHeight);
    },
    [minHeight, maxHeight],
  );

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    window.removeEventListener("mousemove", resize);
    window.removeEventListener("mouseup", stopResizing);
  }, [resize]);

  // Clean up event listeners on unmount (safety)
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div
      className={cn("relative flex flex-col", className)}
      style={{ height }}
      {...props}
    >
      <div className="flex-1 overflow-hidden">{children}</div>
      <div
        onMouseDown={startResizing}
        className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center cursor-row-resize hover:bg-[#333333]/50 transition-colors group z-10"
      >
        <div className="h-1 w-12 rounded-full bg-[#333333] group-hover:bg-[#5eead4] transition-colors" />
      </div>
    </div>
  );
}
