import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Penggabung kelas Tailwind untuk komponen antarmuka. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

