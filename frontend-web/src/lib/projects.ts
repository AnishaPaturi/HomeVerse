import { fetchApi } from "./api";
import { Project, CreateProjectInput } from "@/types/project";

export async function getProjects(userId?: string, email?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (userId && userId !== "u-demo-123" && userId !== "d0000000-0000-0000-0000-000000000000") {
    params.append("user_id", userId);
  } else if (email) {
    params.append("email", email);
  }
  const q = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi<Project[]>(`/api/projects${q}`);
}

export async function getProject(projectId: string): Promise<Project> {
  return await fetchApi<Project>(`/api/projects/${projectId}`);
}

export async function createProject(data: any): Promise<Project> {
  return await fetchApi<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const projectApi = {
  getProjects,
  getProject,
  createProject,
};

export default projectApi;
