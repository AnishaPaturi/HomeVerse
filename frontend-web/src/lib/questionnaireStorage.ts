/**
 * HomeVerse Questionnaire & Progress Persistence Engine
 * Ensures questions asked in both the Preferences Discovery Questionnaire
 * and the Home Setup Wizard are automatically preserved locally and remotely.
 * If the user disconnects, pauses, reloads, or navigates away, they resume
 * from the exact same question/step without losing answers or starting over.
 */

import { fetchApi } from "./api";
import { getStoredUser } from "./auth";

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
  isGenerationComplete?: boolean;
  completedProjectId?: string | null;
  completedRoomId?: string | null;
  checklist?: any[];
  scaleStatus?: string;
  scalePxPerMeter?: number | null;
  missingRooms?: any[];
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
    try {
      localStorage.setItem(PREF_STORAGE_KEY, serialized);
    } catch (_) {}
    try {
      sessionStorage.setItem(PREF_STORAGE_KEY, serialized);
    } catch (_) {}

    // Asynchronously synchronize with backend database so session stops never lose progress
    try {
      const user = getStoredUser();
      fetchApi("/api/preferences/save-progress", {
        method: "POST",
        body: JSON.stringify({
          reactions: updated.reactions,
          questionnaire: updated.questionnaire,
          current_index: updated.currentIndex,
          active_tab: updated.activeTab,
          email: user?.email,
          user_id: user?.id,
        }),
      }).catch(() => {});
    } catch (_) {}
  } catch (err) {
    console.warn("Failed to save preferences progress locally:", err);
  }
}

/**
 * Retrieve saved Preferences question progress from local storage
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
 * Fetch saved questionnaire progress from backend database when session was closed or cleared
 */
export async function fetchRemotePreferencesProgress(email?: string): Promise<PreferencesProgress | null> {
  if (typeof window === "undefined") return null;
  try {
    const targetEmail = email || getStoredUser()?.email;
    const query = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : "";
    const res = await fetchApi<any>(`/api/preferences/progress${query}`);
    if (res && (res.status === "restored" || res.reactions?.length > 0 || res.current_index > 0)) {
      const progress: PreferencesProgress = {
        currentIndex: res.current_index ?? 0,
        reactions: res.reactions ?? [],
        questionnaire: res.questionnaire ? { ...DEFAULT_LIFESTYLE_ANSWERS, ...res.questionnaire } : DEFAULT_LIFESTYLE_ANSWERS,
        activeTab: res.active_tab || "discovery",
        lastSavedAt: new Date().toISOString(),
      };
      try {
        const serialized = JSON.stringify(progress);
        localStorage.setItem(PREF_STORAGE_KEY, serialized);
        sessionStorage.setItem(PREF_STORAGE_KEY, serialized);
      } catch (_) {}
      return progress;
    }
  } catch (err) {
    console.warn("Failed to retrieve remote preferences progress:", err);
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
      isGenerationComplete: data.isGenerationComplete ?? existing?.isGenerationComplete ?? false,
      completedProjectId: data.completedProjectId !== undefined ? data.completedProjectId : existing?.completedProjectId ?? null,
      completedRoomId: data.completedRoomId !== undefined ? data.completedRoomId : existing?.completedRoomId ?? null,
      checklist: data.checklist ?? existing?.checklist ?? [],
      scaleStatus: data.scaleStatus ?? existing?.scaleStatus ?? "verified",
      scalePxPerMeter: data.scalePxPerMeter !== undefined ? data.scalePxPerMeter : existing?.scalePxPerMeter ?? 50.0,
      missingRooms: data.missingRooms ?? existing?.missingRooms ?? [],
      lastSavedAt: new Date().toISOString(),
    };

    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
      sessionStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
    } catch (quotaError) {
      console.warn("Storage quota hit, saving draft with photo and large image data stripped:", quotaError);
      const fallback = {
        ...updated,
        floorPlanPreviewUrl: updated.floorPlanPreviewUrl && updated.floorPlanPreviewUrl.length > 500000
          ? "/templates/modern_north_layout-a.jpg"
          : updated.floorPlanPreviewUrl,
        roomPhotos: (updated.roomPhotos || []).map((p: any) => ({
          id: p.id,
          source: p.source,
          label: p.label,
          name: p.name,
          timestamp: p.timestamp,
          url: p.url && p.url.startsWith("data:") && p.url.length > 50000 ? "" : p.url,
        })),
      };
      try {
        const serializedFallback = JSON.stringify(fallback);
        localStorage.setItem(NEW_HOME_DRAFT_KEY, serializedFallback);
        sessionStorage.setItem(NEW_HOME_DRAFT_KEY, serializedFallback);
      } catch (secondErr) {
        // Minimal fallback guaranteeing all textual step choices are preserved
        const minimalFallback = {
          currentStep: updated.currentStep,
          propertyType: updated.propertyType,
          projectName: updated.projectName,
          floorCount: updated.floorCount,
          bhk: updated.bhk,
          bedroomsCount: updated.bedroomsCount,
          bathroomsCount: updated.bathroomsCount,
          balconiesCount: updated.balconiesCount,
          totalBudget: updated.totalBudget,
          flexibility: updated.flexibility,
          floorPlanPreviewUrl: "/templates/modern_north_layout-a.jpg",
          detectedRooms: updated.detectedRooms,
          selectedRoom: updated.selectedRoom,
          designStyle: updated.designStyle,
          roomPhotos: [],
          isGenerationComplete: updated.isGenerationComplete,
          completedProjectId: updated.completedProjectId,
          completedRoomId: updated.completedRoomId,
          lastSavedAt: updated.lastSavedAt,
        };
        try {
          const minimalSerialized = JSON.stringify(minimalFallback);
          localStorage.setItem(NEW_HOME_DRAFT_KEY, minimalSerialized);
          sessionStorage.setItem(NEW_HOME_DRAFT_KEY, minimalSerialized);
        } catch (_) {}
      }
    }

    // Also persist draft to backend database asynchronously
    try {
      const user = getStoredUser();
      const remoteDraftPayload = {
        ...updated,
        floorPlanPreviewUrl: updated.floorPlanPreviewUrl && updated.floorPlanPreviewUrl.length > 500000
          ? "/templates/modern_north_layout-a.jpg"
          : updated.floorPlanPreviewUrl,
        roomPhotos: (updated.roomPhotos || []).map((p: any) => ({
          id: p.id,
          source: p.source,
          label: p.label,
          name: p.name,
          timestamp: p.timestamp,
          url: p.url && p.url.startsWith("data:") && p.url.length > 100000 ? "" : p.url,
        })),
      };
      fetchApi("/api/projects/draft", {
        method: "POST",
        body: JSON.stringify({
          draft: remoteDraftPayload,
          email: user?.email,
          user_id: user?.id,
        }),
      }).catch(() => {});
    } catch (_) {}
  } catch (err) {
    console.warn("Failed to save home creation draft:", err);
  }
}

/**
 * Retrieve saved Home Creation Wizard draft from local storage
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
 * Fetch saved Home Creation Wizard draft from backend database
 */
export async function fetchRemoteHomeCreationDraft(email?: string): Promise<HomeCreationDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const targetEmail = email || getStoredUser()?.email;
    const query = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : "";
    const res = await fetchApi<any>(`/api/projects/draft${query}`);
    if (res && res.status === "found" && res.draft) {
      const draft = res.draft as HomeCreationDraft;
      try {
        const serialized = JSON.stringify(draft);
        localStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
        sessionStorage.setItem(NEW_HOME_DRAFT_KEY, serialized);
      } catch (_) {}
      return draft;
    }
  } catch (err) {
    console.warn("Failed to retrieve remote home creation draft:", err);
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

    // Also clear from backend database
    const user = getStoredUser();
    const query = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    fetchApi(`/api/projects/draft${query}`, { method: "DELETE" }).catch(() => {});
  } catch (err) {
    console.warn("Failed to clear home creation draft:", err);
  }
}
