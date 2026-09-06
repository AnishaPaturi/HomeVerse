"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Room } from "@/types";
import { fetchApi } from "@/lib/api";
import { Plus, X, Layers, Compass, CheckCircle2 } from "lucide-react";

const INITIAL_ROOMS: Room[] = [
  { id: "r1", project_id: "p1", name: "Living Room", room_type: "Living Room", area: 240, length: 4.8, width: 4.6 },
  { id: "r2", project_id: "p1", name: "Master Bedroom", room_type: "Master Bedroom", area: 180, length: 4.2, width: 3.9 },
  { id: "r3", project_id: "p1", name: "Modular Kitchen", room_type: "Kitchen", area: 120, length: 3.6, width: 3.1 },
];

export default function ProjectRoomsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("Living Room");
  const [length, setLength] = useState<number>(4.0);
  const [width, setWidth] = useState<number>(3.5);

  const calculatedSqFt = Math.round(length * width * 10.764);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await fetchApi<Room[]>(`/api/projects/${projectId}/rooms`);
        if (data && data.length > 0) {
          setRooms(data);
        }
      } catch (err) {
        console.warn("Using initial room data", err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [projectId]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        room_type: roomType,
        length: Number(length),
        width: Number(width),
        area: calculatedSqFt,
        status: "planning",
      };

      const created = await fetchApi<Room>(`/api/projects/${projectId}/rooms`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (created && created.id) {
        setRooms((prev) => [...prev, created]);
      } else {
        // Fallback local room
        const fallbackRoom: Room = {
          id: `room-${Date.now()}`,
          project_id: projectId,
          name,
          room_type: roomType,
          length: Number(length),
          width: Number(width),
          area: calculatedSqFt,
          status: "planning",
        };
        setRooms((prev) => [...prev, fallbackRoom]);
      }

      setIsModalOpen(false);
      setName("");
      setLength(4.0);
      setWidth(3.5);
    } catch (err) {
      console.error("Failed to add room:", err);
      // Add locally anyway for smooth MVP UX
      const fallbackRoom: Room = {
        id: `room-${Date.now()}`,
        project_id: projectId,
        name,
        room_type: roomType,
        length: Number(length),
        width: Number(width),
        area: calculatedSqFt,
        status: "planning",
      };
      setRooms((prev) => [...prev, fallbackRoom]);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rooms & Spatial Dimensions</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Configure room boundaries, dimensions, and floor plan zones for 3D layout generation.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            + Add Room
          </button>
        </div>

        {/* Spatial Zone Header Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Locked 3D Architectural Coordinate System
              </h4>
              <p className="text-xs text-gray-600 dark:text-zinc-300">
                {rooms.length} active room zones configured with vector boundary dimensions.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            Total: {rooms.reduce((acc, r) => acc + (r.area || 0), 0)} sq ft
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Add New Room
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Living Room">Living Room</option>
                  <option value="Master Bedroom">Master Bedroom</option>
                  <option value="Bedroom 2">Bedroom 2</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Home Office">Home Office</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                    Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                    Width (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-zinc-400 font-medium">Calculated Area:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {calculatedSqFt} sq ft ({roundTo2(length * width)} m²)
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving Room..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function roundTo2(val: number): number {
  return Math.round(val * 100) / 100;
}
