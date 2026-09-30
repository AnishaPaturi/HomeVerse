"use client";

import React, { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface FloorPlanUploaderProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

export const FloorPlanUploader: React.FC<FloorPlanUploaderProps> = ({ onFileSelected, selectedFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            onFileSelected(file);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFileSelected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Floor Plan Blueprint</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your 2D CAD drawing, builder brochure image, or sketch. You can also paste directly with Ctrl+V.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          isDragOver
            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20"
            : selectedFile
            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
            : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <Upload className="w-8 h-8" />
        </div>

        {selectedFile ? (
          <div>
            <span className="text-base font-bold text-gray-900 dark:text-white block">{selectedFile.name}</span>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              Floor plan captured. Ready for AI dimension analysis.
            </span>
          </div>
        ) : (
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Drop floor plan blueprint here</h4>
            <p className="text-xs text-gray-400 mt-1 mb-4">Supports PNG, JPG, JPEG, WEBP or clipboard screenshot (Ctrl+V)</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all">
              <ImageIcon className="w-4 h-4" />
              Browse Files
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) onFileSelected(e.target.files[0]);
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
