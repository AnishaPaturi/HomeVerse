import { fetchApi } from "./api";
import { Project, CreateProjectInput } from "@/types/project";

export async function getProjects(): Promise<Project[]> {
  return await fetchApi<Project[]>("/api/projects");
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
