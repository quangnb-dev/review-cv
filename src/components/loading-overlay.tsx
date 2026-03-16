"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface LoadingOverlayProps {
  isLoading: boolean;
}

const STATUS_MESSAGES = [
  "Analyzing keywords...",
  "Checking ATS compatibility...",
  "Evaluating experience...",
  "Generating suggestions...",
];

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    // Advance progress gradually to ~90% over ~15 seconds
    // Each tick adds a small random increment, interval every 300ms
    // 15000ms / 300ms = 50 ticks to reach ~90%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const remaining = 90 - prev;
        const increment = Math.random() * (remaining * 0.08) + 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div role="status" aria-label="Analyzing your CV" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Analyzing your CV</h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">{STATUS_MESSAGES[messageIndex]}</p>
        </div>
        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-right text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
