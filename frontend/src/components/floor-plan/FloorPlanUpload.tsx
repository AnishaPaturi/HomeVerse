"use client";

import React from "react";
import { FloorPlanUploader } from "@/components/home-setup/FloorPlanUploader";

export const FloorPlanUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  return <FloorPlanUploader selectedFile={null} onFileSelected={onUpload} />;
};
