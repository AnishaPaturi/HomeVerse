import React from "react";
import { Design } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DesignCardProps {
  design: Design;
  onWhatIf?: (design: Design) => void;
}

export const DesignCard: React.FC<DesignCardProps> = ({ design, onWhatIf }) => {
  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="h-44 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center relative">
          {design.image_url ? (
            <img src={design.image_url} alt={design.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">Preview Pending</span>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{design.name}</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">{design.style}</p>
            </div>
            {design.estimated_cost && (
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(design.estimated_cost)}
              </p>
            )}
          </div>
        </div>
      </div>

      {onWhatIf && (
        <div className="p-3 px-4 bg-gray-50 dark:bg-zinc-900/80 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={() => onWhatIf(design)}
            className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            &ldquo;What If?&rdquo; Mode
          </button>
        </div>
      )}
    </div>
  );
};
