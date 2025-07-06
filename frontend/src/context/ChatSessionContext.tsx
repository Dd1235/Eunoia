// src/context/ChatSessionContext.tsx
import React, { createContext, useContext, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Message = { role: 'user' | 'agent'; content: string };
type LogsConfig = { study: boolean; sleep: boolean; mood: boolean };

const defaultLogsConfig: LogsConfig = { study: true, sleep: true, mood: true };

const ChatSessionContext = createContext<
  | {
      sessionId: string | null;
      setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
      history: Message[];
      setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
      logsConfig: LogsConfig;
      setLogsConfig: React.Dispatch<React.SetStateAction<LogsConfig>>;
    }
  | undefined
>(undefined);

export const ChatSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [logsConfig, setLogsConfig] = useState<LogsConfig>(defaultLogsConfig);

  return (
    <ChatSessionContext.Provider
      value={{
        sessionId,
        setSessionId,
        history,
        setHistory,
        logsConfig,
        setLogsConfig,
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
};

export const useChatSession = () => {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) throw new Error('useChatSession must be used within ChatSessionProvider');
  return ctx;
};
