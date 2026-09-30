import React from "react";
import Link from "next/link";
import { Room } from "@/types/room";
import { ArrowRight, BedDouble, DoorClosed, UtensilsCrossed, Bath, Sparkles } from "lucide-react";

interface RoomCardProps {
  room: Room;
  projectId?: string;
  onSelect?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, projectId, onSelect }) => {
  const isCompleted = room.status === "completed";
  const isInProgress = room.status === "in_progress";

  const getIcon = () => {
    const t = room.room_type.toLowerCase();
    if (t.includes("living") || t.includes("hall")) return <DoorClosed className="w-5 h-5 text-indigo-500" />;
    if (t.includes("bed")) return <BedDouble className="w-5 h-5 text-teal-500" />;
    if (t.includes("kitchen")) return <UtensilsCrossed className="w-5 h-5 text-amber-500" />;
    return <Bath className="w-5 h-5 text-sky-500" />;
  };

  const playgroundHref = projectId
    ? `/project/${projectId}/rooms/${room.id}/playground`
    : `/studio?room=${room.id}`;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
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

        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{room.name}</h4>
        <span className="text-xs text-gray-400 block mb-2">{room.room_type}</span>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {room.area ? `${room.area} sq ft` : room.length && room.width ? `${room.length}m × ${room.width}m` : "Standard Dimensions"}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <Link
          href={playgroundHref}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 group"
        >
          Open 2D / 3D Playground
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
