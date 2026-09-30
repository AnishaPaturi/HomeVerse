"use client";

import { useEffect, useRef, useState } from "react";

export function useAutoSave<T>(data: T, onSave: (data: T) => Promise<void> | void, delay = 1000) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(data);
        setLastSaved(new Date());
      } catch (err) {
        console.error("AutoSave failed:", err);
      } finally {
        setSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, onSave]);

  return { saving, lastSaved };
}
