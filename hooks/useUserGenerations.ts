import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export type Generation = {
  prompt: string;
  image: ImageResponse;
};

type Session = {
  sessionId: string;
  generations: Generation[];
  prompts: string[];
};

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

const useUserGenerations = () => {
  const { session: sessionIdFromUrl } = useParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionIdFromUrl ? (sessionIdFromUrl as string) : null,
  );

  useEffect(() => {
    const storedSessionIds = localStorage.getItem("userSessions");
    if (storedSessionIds) {
      const sessionIds = JSON.parse(storedSessionIds);
      const sessions = sessionIds
        .map((sessionId: string) => {
          const storedSession = localStorage.getItem(
            `userSession-${sessionId}`,
          );
          return storedSession ? JSON.parse(storedSession) : null;
        })
        .filter((session: Session | null) => session !== null);
      setSessions(sessions);
      if (
        sessionIdFromUrl &&
        !sessions.find(
          (session: Session) => session.sessionId === sessionIdFromUrl,
        )
      ) {
        setCurrentSessionId(sessionIdFromUrl as string);
      } else if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].sessionId);
      }
    } else if (sessionIdFromUrl) {
      setCurrentSessionId(sessionIdFromUrl as string);
    }
  }, []);

  const addGeneration = (
    sessionId: string,
    generation: Generation,
    prompt: string,
  ) => {
    setSessions((prevSessions) => {
      let updatedSessions = prevSessions;
      if (
        !prevSessions.find(
          (session: Session) => session.sessionId === sessionId,
        )
      ) {
        const newSession = { sessionId, generations: [], prompts: [] };
        updatedSessions = [...prevSessions, newSession];
        localStorage.setItem(
          "userSessions",
          JSON.stringify([
            ...prevSessions.map((session: Session) => session.sessionId),
            sessionId,
          ]),
        );
        localStorage.setItem(
          `userSession-${sessionId}`,
          JSON.stringify(newSession),
        );
      }
      const updatedSession = updatedSessions.find(
        (session: Session) => session.sessionId === sessionId,
      );
      if (updatedSession) {
        updatedSession.generations = [
          ...updatedSession.generations,
          generation,
        ];
        updatedSession.prompts = [...updatedSession.prompts, prompt];
        localStorage.setItem(
          `userSession-${sessionId}`,
          JSON.stringify(updatedSession),
        );
      }
      return updatedSessions;
    });
  };

  const currentSession = sessions.find(
    (session) => session.sessionId === currentSessionId,
  );

  return {
    sessions,
    currentSession,
    addGeneration,
  };
};

export default useUserGenerations;
