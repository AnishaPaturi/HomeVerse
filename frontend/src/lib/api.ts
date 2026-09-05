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

