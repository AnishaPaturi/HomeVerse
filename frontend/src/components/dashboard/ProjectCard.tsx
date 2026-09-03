import React from "react";
import Link from "next/link";
import { Project } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{project.name}</h3>
        <span className="text-xs uppercase font-medium px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded">
          {project.property_type}
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-1 mb-4">
        {project.bhk && <p>{project.bhk} BHK Configuration</p>}
        {project.area_sqft && <p>{project.area_sqft} sq.ft</p>}
        {project.budget && <p className="font-medium text-gray-900 dark:text-white">Budget: {formatCurrency(project.budget)}</p>}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <Link
          href={`/project/${project.id}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          View Project &rarr;
        </Link>
      </div>
    </div>
  );
};
