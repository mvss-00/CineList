import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EntryStatus } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export const STATUS_LABELS: Record<EntryStatus, string> = {
  watching: "Смотрю",
  completed: "Просмотрено",
  plan_to_watch: "Планирую",
  dropped: "Брошено",
};

export const STATUS_COLORS: Record<EntryStatus, string> = {
  watching: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  plan_to_watch: "bg-yellow-100 text-yellow-800",
  dropped: "bg-red-100 text-red-800",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
