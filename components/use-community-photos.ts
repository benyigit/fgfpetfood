'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CommunityPhoto = { id: string; dog_name: string; title: string; category: string; caption: string };

export function useCommunityPhotos() {
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const pending = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    try {
      const response = await fetch('/api/community/feed', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Gallery unavailable');
      const data = await response.json();
      if (!Array.isArray(data.photos)) throw new Error('Gallery unavailable');
      if (!controller.signal.aborted) {
        setPhotos(data.photos);
        setFailed(false);
      }
    } catch {
      if (!controller.signal.aborted) {
        setPhotos([]);
        setFailed(true);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const update = () => { void refresh(); };
    const storage = (event: StorageEvent) => {
      if (event.key === 'community-update') update();
    };
    window.addEventListener('focus', update);
    window.addEventListener('community:updated', update);
    window.addEventListener('storage', storage);
    return () => {
      pending.current?.abort();
      window.removeEventListener('focus', update);
      window.removeEventListener('community:updated', update);
      window.removeEventListener('storage', storage);
    };
  }, [refresh]);

  return { photos, loading, failed, refresh };
}
