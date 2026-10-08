"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X,
  Camera,
  Upload,
  Eye,
  Maximize2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { StoredRoomPhoto, getStoredProject, saveProjectLocally } from "@/lib/projectStorage";

interface RoomPhotosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomName: string;
  photos: StoredRoomPhoto[];
  onPhotosUpdate: (updatedPhotos: StoredRoomPhoto[]) => void;
}

export default function RoomPhotosDrawer({
  isOpen,
  onClose,
  projectId,
  roomName,
  photos,
  onPhotosUpdate,
}: RoomPhotosDrawerProps) {
  const [activePhoto, setActivePhoto] = useState<StoredRoomPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle uploading additional photo directly from playground
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: StoredRoomPhoto = {
        id: `photo-${Date.now()}`,
        url: dataUrl,
        source: "upload",
        label: `${roomName} Playground Upload`,
        name: file.name,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updated = [newPhoto, ...photos];
      onPhotosUpdate(updated);

      // Persist to project storage
      const proj = getStoredProject(projectId);
      if (proj) {
        proj.room_photos = updated;
        saveProjectLocally(proj);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (photoId: string) => {
    const updated = photos.filter((p) => p.id !== photoId);
    onPhotosUpdate(updated);
    if (activePhoto?.id === photoId) setActivePhoto(null);

    const proj = getStoredProject(projectId);
    if (proj) {
      proj.room_photos = updated;
      saveProjectLocally(proj);
    }
  };

  // Default fallback reference photos if user didn't take any in wizard
  const displayPhotos = photos.length > 0 ? photos : [
    {
      id: "ref-default-1",
      url: "/rooms/empty-room.png",
      source: "capture",
      label: "Intake Reference (Empty Space)",
      timestamp: "Baseline Intake",
    },
    {
      id: "ref-default-2",
      url: "/rooms/master-bed-room-1.png",
      source: "twin",
      label: "Initial Spatial Scan",
      timestamp: "Baseline Intake",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <aside className="relative ml-auto w-full max-w-md h-full bg-[#090e15] border-l border-white/[0.08] flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#070b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Room Intake Photos
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                {roomName} • {photos.length} captured reference(s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Cross-Reference Dual View: </span>
              Compare your real-world room photos with your live 3D CAD Twin to inspect wall clearances, windows, and furniture scales.
            </div>
          </div>

          {/* Upload Extra Photo trigger */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-emerald-500 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isUploading ? "Uploading..." : "+ Add Intake Photo"}</span>
            </button>
          </div>

          {/* Photo Gallery Grid */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Captured Room Angles ({displayPhotos.length})
            </div>

            <div className="grid grid-cols-2 gap-3">
              {displayPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer aspect-[4/3] bg-slate-950 ${
                    activePhoto?.id === photo.id
                      ? "border-emerald-500 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-[10px] font-bold text-white truncate">
                      {photo.label}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="capitalize">{photo.source}</span>
                      {photo.timestamp && <span>• {photo.timestamp}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Photo Expanded Detail */}
          {activePhoto && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Selected Reference
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {activePhoto.timestamp || "Original Intake"}
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <Image
                  src={activePhoto.url}
                  alt={activePhoto.label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="text-xs text-slate-300 font-sans leading-relaxed">
                <div className="font-semibold text-white">{activePhoto.label}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Source: {activePhoto.source === "capture" ? "Live Webcam Snapshot" : "File Upload"} • Ground Truth Reference
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#070b10] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>HomeVerse Vision AI Sync</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
