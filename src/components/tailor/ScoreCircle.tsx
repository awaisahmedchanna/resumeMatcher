"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: "sm" | "lg";
  color?: string;
}

export default function ScoreCircle({
  score,
  label,
  size = "lg",
  color,
}: ScoreCircleProps) {
  const circumference = size === "lg" ? 2 * Math.PI * 54 : 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    color ||
    (score >= 80
      ? "#22c55e"
      : score >= 60
      ? "#eab308"
      : score >= 40
      ? "#f97316"
      : "#ef4444");

  const dim = size === "lg" ? 120 : 80;
  const r = size === "lg" ? 54 : 36;
  const strokeW = size === "lg" ? 8 : 6;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeW}
            className="text-muted"
            opacity={0.2}
          />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold",
              size === "lg" ? "text-2xl" : "text-base"
            )}
          >
            {score}%
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {label}
      </span>
    </motion.div>
  );
}
