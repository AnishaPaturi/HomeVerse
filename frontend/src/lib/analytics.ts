/**
 * Product Analytics Client & Telemetry Tracking (Phase 45)
 * Captures user lifecycle events:
 * - user_registered, project_created, room_created, style_selected,
 *   design_generated, design_selected, budget_optimized, product_added,
 *   shopping_item_ordered, execution_started, project_completed
 */
import { fetchApi } from "./api";

export type ProductEventName =
  | "user_registered"
  | "project_created"
  | "room_created"
  | "style_selected"
  | "design_generated"
  | "design_selected"
  | "budget_optimized"
  | "product_added"
  | "shopping_item_ordered"
  | "execution_started"
  | "project_completed"
  | (string & {});

export interface AnalyticsSummary {
  window_days: number;
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  event_counts: Record<string, number>;
}

export interface FunnelStep {
  step_number: number;
  event_name: string;
  total_events: number;
  unique_users: number;
  conversion_rate_from_start: number;
  drop_off_rate_from_previous: number;
}

export interface FunnelAnalysis {
  window_days: number;
  funnel_steps: FunnelStep[];
  primary_drop_off_stage: string | null;
  overall_conversion_rate: number;
}

export interface PopularRoom {
  room_type: string;
  count: number;
  percentage: number;
}

export interface PopularStyle {
  style: string;
  count: number;
  percentage: number;
}

export interface BudgetStatistics {
  average_budget: number;
  median_budget: number;
  min_budget: number;
  max_budget: number;
  total_data_points: number;
}

export interface GenerationStatistics {
  total_generations: number;
  active_generating_users: number;
  active_generating_projects: number;
  average_generations_per_user: number;
  average_generations_per_project: number;
}

export interface ProductInsights {
  window_days: number;
  popular_rooms: PopularRoom[];
  popular_styles: PopularStyle[];
  budget_statistics: BudgetStatistics;
  generation_statistics: GenerationStatistics;
  feature_utility: Array<{ feature_event: string; count: number }>;
}

export interface AnalyticsEventRecord {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  properties: Record<string, any>;
  created_at: string;
}

/**
 * Fires a telemetry event to the HomeVerse backend.
 * Fails gracefully in the background without interrupting UI interactions.
 */
export async function trackProductEvent(
  eventName: ProductEventName,
  properties?: Record<string, any>,
  userId?: string,
  sessionId?: string
): Promise<{ status: string; event_id?: string }> {
  try {
    return await fetchApi<{ status: string; event_id?: string }>("/api/analytics/track", {
      method: "POST",
      body: JSON.stringify({
        event_name: eventName,
        properties: properties || {},
        user_id: userId,
        session_id: sessionId,
      }),
    });
  } catch (error) {
    // Non-blocking telemetry failure
    console.debug(`[Analytics] Failed to track ${eventName}:`, error);
    return { status: "failed" };
  }
}

export async function fetchAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
  return fetchApi<AnalyticsSummary>(`/api/analytics/summary?days=${days}`);
}

export async function fetchAnalyticsFunnel(days: number = 30): Promise<FunnelAnalysis> {
  return fetchApi<FunnelAnalysis>(`/api/analytics/funnel?days=${days}`);
}

export async function fetchAnalyticsInsights(days: number = 30): Promise<ProductInsights> {
  return fetchApi<ProductInsights>(`/api/analytics/insights?days=${days}`);
}

export async function fetchAnalyticsEvents(params?: {
  event_name?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AnalyticsEventRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.event_name) searchParams.set("event_name", params.event_name);
  if (params?.user_id) searchParams.set("user_id", params.user_id);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const qs = searchParams.toString();
  return fetchApi<AnalyticsEventRecord[]>(`/api/analytics/events${qs ? `?${qs}` : ""}`);
}
