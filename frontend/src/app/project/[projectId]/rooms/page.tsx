"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Room } from "@/types";

const SAMPLE_ROOMS: Room[] = [
  { id: "r1", project_id: "p1", name: "Living Room", room_type: "Living Room", area: 240 },
  { id: "r2", project_id: "p1", name: "Master Bedroom", room_type: "Master Bedroom", area: 180 },
  { id: "r3", project_id: "p1", name: "Modular Kitchen", room_type: "Kitchen", area: 120 },
];

export default function ProjectRoomsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rooms & Dimensions</h1>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
            + Add Room
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
