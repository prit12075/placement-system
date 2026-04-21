import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes, resolving conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Maps a risk level string to a Tailwind color token. */
export function riskColor(level: string): string {
  switch (level) {
    case "Low":
      return "text-green-600";
    case "Medium":
      return "text-amber-600";
    case "High":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

/** Maps a risk level string to a background badge class. */
export function riskBadgeClass(level: string): string {
  switch (level) {
    case "Low":
      return "bg-green-100 text-green-800 border-green-200";
    case "Medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "High":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Formats a decimal number as a percentage string. */
export function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Formats a decimal ratio to 3 significant figures. */
export function fmtRatio(value: number): string {
  return value.toFixed(3);
}
