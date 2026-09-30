import React from "react";
import { formatIndianBudget } from "@/lib/utils";
import { DoorClosed, BedDouble, UtensilsCrossed, Bath, Sparkles, CheckCircle2 } from "lucide-react";

interface RoomBudgetShare {
  roomName: string;
  roomType: string;
  allocatedAmount: number;
  spentAmount: number;
  status: string;
}

interface RoomBudgetProps {
  rooms?: RoomBudgetShare[];
  totalBudget?: number;
}

const DEFAULT_ROOM_SHARES: RoomBudgetShare[] = [
  { roomName: "Living Room", roomType: "Living Room", allocatedAmount: 500000, spentAmount: 420000, status: "completed" },
  { roomName: "Kitchen", roomType: "Kitchen", allocatedAmount: 600000, spentAmount: 580000, status: "completed" },
  { roomName: "Master Bedroom", roomType: "Bedroom", allocatedAmount: 400000, spentAmount: 380000, status: "completed" },
  { roomName: "Bedroom 2", roomType: "Bedroom", allocatedAmount: 300000, spentAmount: 180000, status: "in_progress" },
  { roomName: "Bathroom", roomType: "Bathroom", allocatedAmount: 200000, spentAmount: 140000, status: "planning" },
  { roomName: "Other / Contingency", roomType: "Other", allocatedAmount: 500000, spentAmount: 440000, status: "planning" },
];

export const RoomBudget: React.FC<RoomBudgetProps> = ({ rooms = DEFAULT_ROOM_SHARES, totalBudget = 2500000 }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">Room Budget Envelopes</h4>
          <p className="text-xs text-gray-500">Progressive distribution calculated as rooms are modeled</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
          AI Proportional Split
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {rooms.map((room, idx) => {
          const pct = Math.round((room.spentAmount / room.allocatedAmount) * 100);
          return (
            <div key={idx} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                  {room.roomType === "Living Room" ? (
                    <DoorClosed className="w-4 h-4 text-indigo-500" />
                  ) : room.roomType === "Kitchen" ? (
                    <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                  ) : room.roomType === "Bedroom" ? (
                    <BedDouble className="w-4 h-4 text-teal-500" />
                  ) : (
                    <Bath className="w-4 h-4 text-sky-500" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">{room.roomName}</span>
                  <span className="text-[11px] text-gray-500">
                    Spent {formatIndianBudget(room.spentAmount)} of {formatIndianBudget(room.allocatedAmount)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-white block">
                  {formatIndianBudget(room.allocatedAmount)}
                </span>
                <span className={`text-[11px] font-medium ${pct > 95 ? "text-rose-500" : "text-emerald-500"}`}>
                  {pct}% committed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
