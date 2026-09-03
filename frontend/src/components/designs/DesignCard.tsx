import React from "react";
import { Design } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DesignCardProps {
  design: Design;
}

export const DesignCard: React.FC<DesignCardProps> = ({ design }) => {
  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      <div className="h-44 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center relative">
        {design.image_url ? (
          <img src={design.image_url} alt={design.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-xs">Preview Pending</span>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">{design.name}</h4>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">{design.style}</p>
        {design.estimated_cost && (
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {formatCurrency(design.estimated_cost)}
          </p>
        )}
      </div>
    </div>
  );
};
