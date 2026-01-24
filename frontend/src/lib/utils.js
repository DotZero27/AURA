import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return format(d, "h:mm a");
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return format(d, "MMM dd, yyyy");
}

export function formatDateWithDay(date) {
  if (!date) return "";
  const d = new Date(date);
  return format(d, "MMM dd, EEE");
}

/**
 * Get tournament category label from match format
 * @param {Object} matchFormat - Match format object with eligible_gender property
 * @returns {string} Category label (Men's Doubles, Women's Doubles, or Mixed Doubles)
 */
export function getTournamentCategory(matchFormat) {
  if (!matchFormat?.eligible_gender) return "Mixed Doubles";
  
  return matchFormat.eligible_gender === "M"
    ? "Men's Doubles"
    : matchFormat.eligible_gender === "W"
    ? "Women's Doubles"
    : "Mixed Doubles";
}
