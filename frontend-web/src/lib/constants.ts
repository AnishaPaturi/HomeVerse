/**
 * HomeVerse Application Constants
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const ROOM_TYPES = [
  "Living Room",
  "Master Bedroom",
  "Guest Bedroom",
  "Kitchen",
  "Dining Room",
  "Bathroom",
  "Balcony",
  "Study / Home Office",
  "Pooja Room",
  "Utility",
] as const;

export const INTERIOR_STYLES = [
  { id: "modern", label: "Modern", description: "Clean lines, sleek surfaces, uncluttered elegance." },
  { id: "minimalist", label: "Minimalist", description: "Essential forms, neutral tones, functional spaces." },
  { id: "scandinavian", label: "Scandinavian", description: "Light woods, cozy textures, warm natural light." },
  { id: "industrial", label: "Industrial", description: "Exposed brick, raw metals, rustic timbers." },
  { id: "warm_contemporary", label: "Warm Contemporary", description: "Earthy palettes, organic textures, sophisticated comfort." },
  { id: "traditional_indian", label: "Traditional Indian", description: "Rich hardwoods, intricate brass, vibrant cultural motifs." },
] as const;
