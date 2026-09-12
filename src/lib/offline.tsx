import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Demo-friendly offline simulation.
 *
 * `simulatedOffline` is a module-level flag so server-function wrappers can read
 * it synchronously. When offline, reads throw and TanStack Query keeps serving
 * the persisted cache; writes are pushed onto a queue in localStorage and
 * flushed, visibly, when the user comes back online.
 */
let simulatedOffline = false;

export function isOffline(): boolean {
  if (simulatedOffline) return true;
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export class OfflineError extends Error {
  constructor() {
    super("offline");
    this.name = "OfflineError";
  }
}

export type QueuedUpdate = {
  id: string;
  recordId: string;
  treatmentStatus: string;
  facility: string;
  queuedAt: string;
};

const QUEUE_KEY = "raktlink.queue";

function readQueue(): QueuedUpdate[] {
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedUpdate[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedUpdate[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

type OfflineValue = {
  offline: boolean;
  toggleOffline: () => void;
  queue: QueuedUpdate[];
  enqueue: (item: Omit<QueuedUpdate, "id" | "queuedAt">) => void;
  clearQueue: () => void;
  removeQueued: (id: string) => void;
  lastSynced: string | null;
  markSynced: () => void;
  syncing: boolean;
  setSyncing: (v: boolean) => void;
};

const OfflineContext = createContext<OfflineValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [queue, setQueue] = useState<QueuedUpdate[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setQueue(readQueue());
    setLastSynced(window.localStorage.getItem("raktlink.lastSynced"));
  }, []);

  const toggleOffline = useCallback(() => {
    setOffline((prev) => {
      simulatedOffline = !prev;
      return !prev;
    });
  }, []);

  const enqueue = useCallback((item: Omit<QueuedUpdate, "id" | "queuedAt">) => {
    setQueue((prev) => {
      const next = [
        ...prev,
        { ...item, id: crypto.randomUUID(), queuedAt: new Date().toISOString() },
      ];
      writeQueue(next);
      return next;
    });
  }, []);

  const removeQueued = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((q) => q.id !== id);
      writeQueue(next);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    writeQueue([]);
  }, []);

  const markSynced = useCallback(() => {
    const now = new Date().toISOString();
    window.localStorage.setItem("raktlink.lastSynced", now);
    setLastSynced(now);
  }, []);

  const value = useMemo(
    () => ({
      offline,
      toggleOffline,
      queue,
      enqueue,
      clearQueue,
      removeQueued,
      lastSynced,
      markSynced,
      syncing,
      setSyncing,
    }),
    [offline, toggleOffline, queue, enqueue, clearQueue, removeQueued, lastSynced, markSynced, syncing],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used inside OfflineProvider");
  return ctx;
}

/** Wrap a read so it fails fast while offline and the cache is used instead. */
export async function guardedRead<T>(fn: () => Promise<T>): Promise<T> {
  if (isOffline()) throw new OfflineError();
  return fn();
}
