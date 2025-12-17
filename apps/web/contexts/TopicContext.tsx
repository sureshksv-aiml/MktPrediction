"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface Topic {
  id: string;
  name: string;
  isActive: boolean;
}

const TOPICS: Topic[] = [
  { id: "market-pulse", name: "Market Pulse", isActive: true },
];

interface TopicContextType {
  topics: Topic[];
  selectedTopic: Topic;
  selectTopic: (topicId: string) => void;
}

const TopicContext = createContext<TopicContextType | undefined>(undefined);

interface TopicProviderProps {
  children: ReactNode;
}

export function TopicProvider({ children }: TopicProviderProps): React.ReactElement {
  const [selectedTopic, setSelectedTopic] = useState<Topic>(TOPICS[0]);

  const selectTopic = useCallback(
    (topicId: string) => {
      const topic = TOPICS.find((t) => t.id === topicId);
      if (topic && topic.isActive && topic.id !== selectedTopic.id) {
        setSelectedTopic(topic);
      }
    },
    [selectedTopic.id]
  );

  return (
    <TopicContext.Provider value={{ topics: TOPICS, selectedTopic, selectTopic }}>
      {children}
    </TopicContext.Provider>
  );
}

export function useTopic(): TopicContextType {
  const context = useContext(TopicContext);
  if (!context) {
    throw new Error("useTopic must be used within a TopicProvider");
  }
  return context;
}
