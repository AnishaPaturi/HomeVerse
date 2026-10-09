/**
 * HomeVerse Questionnaire & Progress Persistence Engine
 * Ensures questions asked in both the Preferences Discovery Questionnaire
 * and the Home Setup Wizard are automatically preserved locally and remotely.
 * If the user disconnects, pauses, reloads, or navigates away, they resume
 * from the exact same question/step without losing answers or starting over.
 */

export interface LifestyleAnswers {
  family_size: string;
  pets: boolean;
  children: boolean;
  work_from_home: string;
  entertainment: string;
  storage_requirements: string;
  maintenance_preference: string;
}

export interface ReactionRecord {
  image_id: string;
  reaction: "like" | "dislike" | "skip" | string;
}

export interface PreferencesProgress {
  currentIndex: number;
  reactions: ReactionRecord[];
  questionnaire: LifestyleAnswers;
  activeTab: "discovery" | "questionnaire";
  styleProfile?: any;
  lastSavedAt: string;
}

export interface HomeCreationDraft {
  currentStep: number;
  propertyType: "independent" | "apartment";
  projectName: string;
  floorCount: number;
  bhk: number;
  bedroomsCount: number;
  bathroomsCount: number;
  balconiesCount: number;
  totalBudget: number;
  flexibility: "Strict" | "Moderate" | "Flexible";
  floorPlanPreviewUrl: string;
  detectedRooms: any[];
  selectedRoom: string;
  designStyle: string;
  roomPhotos: any[];
  lastSavedAt: string;
}

const PREF_STORAGE_KEY = "homeverse_preferences_progress";
const NEW_HOME_DRAFT_KEY = "homeverse_new_home_draft";

export const DEFAULT_LIFESTYLE_ANSWERS: LifestyleAnswers = {
  family_size: "3-4",
  pets: false,
  children: true,
  work_from_home: "hybrid",
  entertainment: "frequent",
  storage_requirements: "high",
  maintenance_preference: "low_maintenance",
};

/**
 * Save user's question progress & answers in Preferences Discovery & Lifestyle Questionnaire
 */
export function savePreferencesProgress(data: Partial<PreferencesProgress>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getStoredPreferencesProgress();
    const updated: PreferencesProgress = {
      currentIndex: data.currentIndex ?? existing?.currentIndex ?? 0,
      reactions: data.reactions ?? existing?.reactions ?? [],
      questionnaire: {
        ...(existing?.questionnaire || DEFAULT_LIFESTYLE_ANSWERS),
        ...(data.questionnaire || {}),
      },
      activeTab: data.activeTab ?? existing?.activeTab ?? "discovery",
      styleProfile: data.styleProfile !== undefined ? data.styleProfile : existing?.styleProfile,
      lastSavedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(updated);
    localStorage.setItem(PREF_STORAGE_KEY, serialized);
    sessionStorage.setItem(PREF_STORAGE_KEY, serialized);
  } catch (err) {
    console.warn("Failed to save preferences progress locally:", err);
  }
}

/**
 * Retrieve saved Preferences question progress
 */
export function getStoredPreferencesProgress(): PreferencesProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const rawLocal = localStorage.getItem(PREF_STORAGE_KEY);
    if (rawLocal) {
      return JSON.parse(rawLocal);
    }

    const rawSession = sessionStorage.getItem(PREF_STORAGE_KEY);
    if (rawSession) {
      return JSON.parse(rawSession);
    }
  } catch (err) {
    console.warn("Failed to retrieve stored preferences progress:", err);
  }

  return null;
}

/**
 * Clear stored preferences progress (for explicit restarts)
 */
export function clearPreferencesProgress(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(PREF_STORAGE_KEY);
    sessionStorage.removeItem(PREF_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear preferences progress:", err);
  }
}

/**
 * Save Home Creation Wizard draft progress (Step 1 to 11)
 */
export function saveHomeCreationDraft(data: Partial<HomeCreationDraft>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getStoredHomeCreationDraft();
    const updated: HomeCreationDraft = {
      currentStep: data.currentStep ?? existing?.currentStep ?? 1,
      propertyType: data.propertyType ?? existing?.propertyType ?? "apartment",
      projectName: data.projectName ?? existing?.projectName ?? "My Dream Residence",
      floorCount: data.floorCount ?? existing?.floorCount ?? 1,
      bhk: data.bhk ?? existing?.bhk ?? 3,
      bedroomsCount: data.bedroomsCount ?? existing?.bedroomsCount ?? 3,
      bathroomsCount: data.bathroomsCount ?? existing?.bathroomsCount ?? 2,
      balconiesCount: data.balconiesCount ?? existing?.balconiesCount ?? 2,
      totalBudget: data.totalBudget ?? existing?.totalBudget ?? 1500000,
      flexibility: data.flexibility ?? existing?.flexibility ?? "Moderate",
      floorPlanPreviewUrl: data.floorPlanPreviewUrl ?? existing?.floorPlanPreviewUrl ?? "/templates/modern_north_layout-a.jpg",
      detectedRooms: data.detectedRooms ?? existing?.detectedRooms ?? [],
      selectedRoom: data.selectedRoom ?? existing?.selectedRoom ?? "Drawing Room",
      designStyle: data.designStyle ?? existing?.designStyle ?? "Japandi",
      roomPhotos: data.roomPhotos ?? existing?.roomPhotos ?? [],
      lastSavedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(updated);
    localStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
    sessionStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
  } catch (err) {
    console.warn("Failed to save home creation draft:", err);
  }
}

/**
 * Retrieve saved Home Creation Wizard draft
 */
export function getStoredHomeCreationDraft(): HomeCreationDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const rawLocal = localStorage.getItem(NEW_HOME_DRAFT_KEY);
    if (rawLocal) {
      return JSON.parse(rawLocal);
    }

    const rawSession = sessionStorage.getItem(NEW_HOME_DRAFT_KEY);
    if (rawSession) {
      return JSON.parse(rawSession);
    }
  } catch (err) {
    console.warn("Failed to retrieve stored home creation draft:", err);
  }

  return null;
}

/**
 * Clear Home Creation Wizard draft (e.g., when home creation is finished or restarted)
 */
export function clearHomeCreationDraft(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(NEW_HOME_DRAFT_KEY);
    sessionStorage.removeItem(NEW_HOME_DRAFT_KEY);
  } catch (err) {
    console.warn("Failed to clear home creation draft:", err);
  }
}
