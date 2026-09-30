"use client";

import React, { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

interface EditableRoom {
  name: string;
  room_type: string;
  width_m: number;
  length_m: number;
  area_sqm: number;
}

interface DimensionCorrectionProps {
  initialRooms: EditableRoom[];
  onSave: (rooms: EditableRoom[]) => void;
  onCancel: () => void;
}

export const DimensionCorrection: React.FC<DimensionCorrectionProps> = ({
  initialRooms,
  onSave,
  onCancel,
}) => {
  const [rooms, setRooms] = useState<EditableRoom[]>(initialRooms);

  const handleUpdate = (index: number, field: keyof EditableRoom, val: any) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === "width_m" || field === "length_m") {
        const w = field === "width_m" ? Number(val) : copy[index].width_m;
        const l = field === "length_m" ? Number(val) : copy[index].length_m;
        copy[index].area_sqm = Number((w * l).toFixed(2));
      }
      return copy;
    });
  };

  const addRow = () => {
    setRooms((prev) => [
      ...prev,
      { name: "New Room", room_type: "Other", width_m: 3.5, length_m: 4.0, area_sqm: 14.0 },
    ]);
  };

  const removeRow = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Fine-tune Room Dimensions</h2>
        <p className="text-sm text-gray-500 mt-1">Adjust width or length in meters or add missing rooms.</p>
      </div>

      <div className="space-y-3 mb-6">
        {rooms.map((room, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <input
              type="text"
              value={room.name}
              onChange={(e) => handleUpdate(idx, "name", e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold flex-1 w-full"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400">Length (m):</span>
              <input
                type="number"
                step="0.1"
                value={room.length_m}
                onChange={(e) => handleUpdate(idx, "length_m", Number(e.target.value))}
                className="w-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold"
              />
              <span className="text-xs text-gray-400">Width (m):</span>
              <input
                type="number"
                step="0.1"
                value={room.width_m}
                onChange={(e) => handleUpdate(idx, "width_m", Number(e.target.value))}
                className="w-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-dashed border-gray-300 dark:border-zinc-700 hover:border-indigo-500 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(rooms)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25"
          >
            Save Adjustments
          </button>
        </div>
      </div>
    </div>
  );
};
