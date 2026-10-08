"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Room } from "@/types/room";
import { ArrowRight, BedDouble, DoorClosed, UtensilsCrossed, Bath, Pencil, Check, X } from "lucide-react";

interface RoomCardProps {
  room: Room;
  projectId?: string;
  onSelect?: (room: Room) => void;
  onRename?: (roomId: string, newName: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, projectId, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);

  const isCompleted = room.status === "completed";
  const isInProgress = room.status === "in_progress";

  const getIcon = () => {
    const t = room.room_type.toLowerCase();
    if (t.includes("living") || t.includes("hall")) return <DoorClosed className="w-5 h-5 text-indigo-500" />;
    if (t.includes("bed")) return <BedDouble className="w-5 h-5 text-teal-500" />;
    if (t.includes("kitchen")) return <UtensilsCrossed className="w-5 h-5 text-amber-500" />;
    return <Bath className="w-5 h-5 text-sky-500" />;
  };

  const handleSaveRename = () => {
    if (editName.trim() && onRename) {
      onRename(room.id, editName.trim());
    }
    setIsEditing(false);
  };

  const playgroundHref = projectId
    ? `/project/${projectId}/rooms/${room.id}/playground`
    : `/studio?room=${room.id}`;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 flex items-center justify-center">
            {getIcon()}
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : isInProgress
                ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500"
            }`}
          >
            {room.status === "completed" ? "Designed" : room.status === "in_progress" ? "In Progress" : "Planning"}
          </span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5 mb-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditName(room.name);
                }
              }}
              autoFocus
              className="px-2.5 py-1 text-sm font-bold bg-white dark:bg-zinc-800 border-2 border-indigo-500 rounded-xl text-gray-900 dark:text-white focus:outline-none flex-1"
            />
            <button
              type="button"
              onClick={handleSaveRename}
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
              title="Save"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditName(room.name);
              }}
              className="p-1.5 rounded-lg bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">{room.name}</h4>
            {onRename && (
              <button
                type="button"
                onClick={() => {
                  setEditName(room.name);
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition-all cursor-pointer"
                title="Rename room"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <span className="text-xs text-gray-400 block mb-2">{room.room_type}</span>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {room.area ? `${room.area} sq ft` : room.length && room.width ? `${room.length}m × ${room.width}m` : "Standard Dimensions"}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <Link
          href={playgroundHref}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 group/link"
        >
          Open 2D / 3D Playground
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
