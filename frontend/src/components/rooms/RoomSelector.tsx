"use client";

import React from "react";
import { Room } from "@/types/room";

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ rooms, selectedRoomId, onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {rooms.map((room) => {
        const active = selectedRoomId === room.id;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {room.name}
          </button>
        );
      })}
    </div>
  );
};
