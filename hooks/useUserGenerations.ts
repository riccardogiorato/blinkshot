import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Generation = {
  prompt: string;
  image: ImageResponse;
};

type Session = {
  sessionId: string;
  generations: Generation[];
};

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

const useUserGenerations = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = useMemo(
    () => searchParams.get("session"),
    [searchParams],
  );

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load all sessions from localStorage on mount
  useEffect(() => {
    const storedSessionIds = localStorage.getItem("userSessions");
    if (!storedSessionIds) return;

    try {
      const sessionIds = JSON.parse(storedSessionIds) as string[];
      const restoredSessions: Session[] = sessionIds
        .map((sessionId: string) => {
          const storedSession = localStorage.getItem(
            `userSession-${sessionId}`,
          );
          return storedSession ? (JSON.parse(storedSession) as Session) : null;
        })
        .filter(
          (session: Session | null): session is Session => session !== null,
        );
      setSessions(restoredSessions);
    } catch {
      // If corrupted, clear to avoid breaking the app
      localStorage.removeItem("userSessions");
    }
  }, []);

  // Sync current session id with URL `?session=...`
  useEffect(() => {
    if (sessionIdFromUrl) {
      setCurrentSessionId(sessionIdFromUrl);
    } else {
      // No session selected in URL. Keep as null to avoid creating sessions on load
      setCurrentSessionId(null);
    }
  }, [sessionIdFromUrl]);

  const persistSessionList = (sessionIds: string[]) => {
    localStorage.setItem("userSessions", JSON.stringify(sessionIds));
  };

  const upsertSession = (
    sessionId: string,
    mutator: (s: Session) => Session,
  ) => {
    setSessions((previousSessions) => {
      const existingSession = previousSessions.find(
        (s) => s.sessionId === sessionId,
      );
      let nextSessions: Session[];
      if (!existingSession) {
        const newSession: Session = { sessionId, generations: [] };
        const updated = mutator(newSession);
        nextSessions = [...previousSessions, updated];
        const existingIds = previousSessions.map((s) => s.sessionId);
        persistSessionList([...existingIds, sessionId]);
        localStorage.setItem(
          `userSession-${sessionId}`,
          JSON.stringify(updated),
        );
      } else {
        const updatedSession = mutator({ ...existingSession });
        nextSessions = previousSessions.map((s) =>
          s.sessionId === sessionId ? updatedSession : s,
        );
        localStorage.setItem(
          `userSession-${sessionId}`,
          JSON.stringify(updatedSession),
        );
      }
      return nextSessions;
    });
  };

  const ensureSessionId = () => {
    let sessionId = sessionIdFromUrl ?? currentSessionId;
    if (!sessionId) {
      sessionId = (
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10)
      ) as string;
      // Update URL without creating a new history entry
      const params = new URLSearchParams(searchParams.toString());
      params.set("session", sessionId);
      router.replace(`/?${params.toString()}`);
      setCurrentSessionId(sessionId);
    }
    return sessionId;
  };

  // Adds a generation to the current session; creates a session if none in URL
  const addGeneration = (generation: Generation, prompt: string) => {
    const sessionId = ensureSessionId();
    upsertSession(sessionId, (session) => ({
      ...session,
      generations: [...session.generations, generation],
    }));
  };

  const deleteSession = (sessionId: string) => {
    setSessions((previousSessions) => {
      const remainingSessions = previousSessions.filter(
        (s) => s.sessionId !== sessionId,
      );
      const remainingIds = remainingSessions.map((s) => s.sessionId);
      localStorage.setItem("userSessions", JSON.stringify(remainingIds));
      localStorage.removeItem(`userSession-${sessionId}`);
      return remainingSessions;
    });

    if (currentSessionId === sessionId) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("session");
      const nextUrl = params.toString() ? `/?${params.toString()}` : "/";
      router.replace(nextUrl);
      setCurrentSessionId(null);
    }
  };

  const currentSession = sessions.find(
    (session) => session.sessionId === currentSessionId,
  );

  return {
    sessions,
    currentSession,
    currentSessionId,
    addGeneration,
    deleteSession,
  };
};

export default useUserGenerations;
