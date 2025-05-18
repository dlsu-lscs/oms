import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string') {
    throw new Error(`${name} environment variable is not set or is not a string`);
  }
  return value;
}
