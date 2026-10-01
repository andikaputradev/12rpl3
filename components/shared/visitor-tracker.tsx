"use client";

import { useEffect, useRef } from "react";
import { incrementVisitorOnce } from "@/lib/actions/visitor";

export function VisitorTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    incrementVisitorOnce().catch((error) => {
      console.error("[visitor-tracker]", error);
    });
  }, []);

  return null;
}
