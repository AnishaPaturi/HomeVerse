/**
 * API Client & Standardized Error Handling for HomeVerse (Phase 41)
 */
import { API_BASE_URL } from "./constants";

export interface StandardApiErrorPayload {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: any;
  };
  detail?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: any;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    details?: any
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

/**
 * Maps error codes to intuitive, human-friendly user messages
 */
export function getHumanErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "BUDGET_EXCEEDED":
        return "Design exceeds the configured budget. Use 'What If?' mode or product alternatives to balance your cost.";
      case "AI_COST_LIMIT_EXCEEDED":
        return "Monthly AI generation budget limit reached for your account tier. Please upgrade your plan or wait until next month.";
      case "AI_GENERATION_FAILED":
        return "AI design generation encountered an issue. Please retry or adjust your custom prompt.";
      case "UNAUTHORIZED":
        return "Your session has expired. Please sign in again to continue.";
      case "FORBIDDEN":
        return "You do not have permission to access or modify this project.";
      case "NOT_FOUND":
        return "The requested project, room, or design could not be found.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please wait a few moments before trying again.";
      case "VALIDATION_ERROR":
        return error.message || "Please check the entered information and try again.";
      case "INTERNAL_SERVER_ERROR":
        return error.requestId
          ? `An unexpected server error occurred (Ref: ${error.requestId.slice(0, 8)}). Please try again.`
          : "An unexpected server error occurred. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = null;
    let rawText = "";

    try {
      rawText = await response.text();
      errorData = JSON.parse(rawText);
    } catch {
      // Body wasn't JSON
    }

    if (errorData && errorData.error) {
      const { code, message, request_id, details } = errorData.error;
      throw new ApiError(
        response.status,
        code || `HTTP_${response.status}`,
        message || errorData.detail || "Request failed",
        request_id,
        details
      );
    } else if (errorData && errorData.detail) {
      throw new ApiError(
        response.status,
        `HTTP_${response.status}`,
        errorData.detail,
        undefined,
        errorData
      );
    }

    throw new ApiError(
      response.status,
      `HTTP_${response.status}`,
      rawText || `API Error ${response.status}`,
      undefined,
      rawText
    );
  }

  return response.json();
}

export interface AiQuota {
  tier: string;
  is_premium: boolean;
  limit_per_day: number;
  used_today: number;
  remaining_today: number;
  resets_in_seconds: number;
}

export async function fetchAiQuota(email?: string): Promise<AiQuota> {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return fetchApi<AiQuota>(`/api/ai/quota${query}`);
}

export interface AiUsageSummary {
  user_id: string;
  plan: string;
  monthly_limit_usd: number;
  current_month_spend_usd: number;
  remaining_budget_usd: number;
  percentage_used: number;
  total_generations: number;
  total_tokens: number;
  total_images: number;
  cost_by_model: Record<string, number>;
  cost_by_operation: Record<string, number>;
  window_days: number;
}

export interface AiSpendingLimit {
  user_id: string;
  plan: string;
  monthly_limit_usd: number;
  current_spend_usd: number;
  remaining_budget_usd: number;
  percentage_used: number;
  is_budget_exceeded: boolean;
}

export async function fetchAiUsageSummary(email?: string, days: number = 30): Promise<AiUsageSummary> {
  const query = email ? `?email=${encodeURIComponent(email)}&days=${days}` : `?days=${days}`;
  return fetchApi<AiUsageSummary>(`/api/ai/usage/summary${query}`);
}

export async function fetchAiSpendingLimits(email?: string): Promise<AiSpendingLimit> {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return fetchApi<AiSpendingLimit>(`/api/ai/usage/limits${query}`);
}

export interface DigitalHomeBook {
  project_id: string;
  name: string;
  property_type: string;
  bhk: number;
  area_sqft: number;
  currency: string;
  target_budget: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  client_profile: {
    user_name: string;
    email: string | null;
    lifestyle: Record<string, any>;
    style_preferences: {
      style?: string;
      colours?: string[];
      materials?: string[];
    };
  };
  floor_plan: {
    thumbnail: string;
    detected_rooms: Array<{ name: string; dimensions: string; area_sqft: number }>;
    structural_summary: string;
  };
  selected_design: {
    id: string;
    name: string;
    style: string;
    estimated_cost: number;
    renders: {
      primary?: string;
      front?: string;
      left?: string;
      right?: string;
      back?: string;
    };
    objects_count: number;
    items_count: number;
  };
  all_designs_compared: Array<{
    id: string;
    name: string;
    style: string;
    estimated_cost: number;
    selected: boolean;
  }>;
  budget_summary: {
    target_budget: number;
    initial_estimate: number;
    optimized_cost: number;
    savings_achieved: number;
    total_expenses_spent: number;
    budget_variance: number;
    is_within_budget: boolean;
    currency: string;
  };
  shopping_inventory: Array<{
    name: string;
    category: string;
    quantity: number;
    estimated_cost: number;
    status: string;
  }>;
  execution_timeline: {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    tasks: Array<{
      name: string;
      status: string;
      actual_cost?: number;
      estimated_cost?: number;
    }>;
  };
  maintenance_and_care: Array<{
    material: string;
    instructions: string;
  }>;
  completion_certificate: {
    certificate_id: string;
    issued_to: string;
    project_name: string;
    completion_date: string;
    issued_by: string;
  };
}

export async function fetchDigitalHomeBook(projectId: string): Promise<DigitalHomeBook> {
  return fetchApi<DigitalHomeBook>(`/api/projects/${projectId}/digital-home-book`);
}

export async function completeProject(projectId: string): Promise<{ status: string; project_id: string; completed_at: string; home_book_url: string }> {
  return fetchApi(`/api/projects/${projectId}/complete`, { method: "POST" });
}

export async function selectDesign(designId: string): Promise<any> {
  return fetchApi(`/api/designs/${designId}/select`, { method: "POST" });
}

export * from "./analytics";




