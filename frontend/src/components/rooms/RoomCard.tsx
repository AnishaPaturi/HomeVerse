import React from "react";
import { Room } from "@/types";

interface RoomCardProps {
  room: Room;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">{room.name}</h4>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
          {room.room_type}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-400">
        {room.area ? `${room.area} sq.ft` : "Dimensions not configured"}
      </p>
    </div>
  );
};
