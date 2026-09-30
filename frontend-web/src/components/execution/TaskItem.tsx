import React from "react";
import { ExecutionTask } from "@/types";

interface TaskItemProps {
  task: ExecutionTask;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
      <div>
        <h5 className="font-medium text-gray-900 dark:text-white text-sm">{task.name}</h5>
        {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
        {task.status.replace("_", " ")}
      </span>
    </div>
  );
};
