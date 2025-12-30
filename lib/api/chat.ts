export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
  };
}

export interface ChatSession {
  id: string;
  sessionId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: string;
  messages?: ChatMessage[];
}

export interface ApiResponse {
  message: string;
  response?: string;
  analysis?: {
    emotionalState: string;
    themes: string[];
    riskLevel: number;
    recommendedApproach: string;
    progressIndicators: string[];
  };
  metadata?: {
    technique: string;
    goal: string;
    progress: any[];
  };
}

const NEXT_API_BASE = "/api/chat";

const getAuthHeaders = (): HeadersInit => {
  let token = "";

  if (typeof window !== "undefined") {
    token =
      localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  }

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),

    "X-Requested-With": "XMLHttpRequest",
  };
};

const handleApiError = async (response: Response, context: string) => {
  const errorText = await response.text();
  console.error(
    `❌ ${context} failed. Status: ${response.status}`,
    errorText.substring(0, 200)
  );

  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch {
    if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
      console.error("❌ Received HTML instead of JSON!");
      errorData = {
        error: `Server returned HTML (likely 404 or redirect)`,
        raw: errorText.substring(0, 100),
      };
    } else {
      errorData = {
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
      };
    }
  }

  throw new Error(
    errorData.error || errorData.message || `Failed to ${context}`
  );
};

export const createChatSession = async (
  title?: string
): Promise<ChatSession> => {
  try {
    console.log("Creating new chat session via Next.js API...");

    const response = await fetch(`${NEXT_API_BASE}/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: title || "New Chat",
        createdAt: new Date().toISOString(),
      }),
    });

    console.log("Create session response status:", response.status);

    if (!response.ok) {
      await handleApiError(response, "create chat session");
    }

    const data = await response.json();
    console.log("✅ Chat session created:", data);

    const sessionData: ChatSession = {
      id: data.id || data.sessionId || data._id || `session-${Date.now()}`,
      sessionId:
        data.sessionId || data.id || data._id || `session-${Date.now()}`,
      title: data.title || "New Chat",
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
      messageCount: data.messageCount || 0,
      lastMessage: data.lastMessage || "",
      messages: data.messages || [],
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("currentSessionId", sessionData.sessionId);
      console.log("Stored session ID in localStorage:", sessionData.sessionId);
    }

    return sessionData;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ApiResponse> => {
  try {
    console.log(
      `📤 Sending message to session ${sessionId}:`,
      message.substring(0, 50) + (message.length > 50 ? "..." : "")
    );

    if (!sessionId || sessionId === "undefined") {
      console.log("No session ID, creating new session first...");
      const newSession = await createChatSession();
      sessionId = newSession.sessionId;
      console.log("Created new session:", sessionId);
    }

    const response = await fetch(
      `${NEXT_API_BASE}/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }),
      }
    );

    console.log("Send message response status:", response.status);

    if (!response.ok) {
      await handleApiError(response, "send chat message");
    }

    const data = await response.json();
    console.log("✅ Message sent successfully:", {
      responseLength: data.response?.length || 0,
      hasAnalysis: !!data.analysis,
    });

    return data;
  } catch (error) {
    console.error("❌ Error sending chat message:", error);

    if (
      error instanceof Error &&
      error.message.includes("session") &&
      error.message.includes("not found")
    ) {
      console.log("Session not found, creating new one...");
      const newSession = await createChatSession();
      return sendChatMessage(newSession.sessionId, message);
    }

    throw error;
  }
};

export const getChatHistory = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  try {
    console.log(`📜 Fetching chat history for session ${sessionId}...`);

    if (!sessionId || sessionId === "undefined") {
      console.warn("No session ID provided for chat history");
      return [];
    }

    const response = await fetch(
      `${NEXT_API_BASE}/sessions/${sessionId}/history`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No chat history found (404)");
        return [];
      }
      await handleApiError(response, "fetch chat history");
    }

    const data = await response.json();
    console.log(
      `✅ Received ${Array.isArray(data) ? data.length : 0} messages`
    );

    let messages: any[] = [];

    if (Array.isArray(data)) {
      messages = data;
    } else if (data.messages && Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (data && typeof data === "object") {
      const arrayValues = Object.values(data).filter((val) =>
        Array.isArray(val)
      );
      messages = arrayValues.length > 0 ? arrayValues[0] : [];
    }

    if (!Array.isArray(messages)) {
      console.error("Invalid chat history format:", data);
      return [];
    }

    return messages.map((msg: any, index: number) => ({
      role:
        msg.role ||
        (msg.sender === "user" ? "user" : "assistant") ||
        (index % 2 === 0 ? "user" : "assistant"),
      content: msg.content || msg.text || msg.message || "",
      timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
      metadata:
        msg.metadata || (msg.analysis ? { analysis: msg.analysis } : undefined),
    }));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    console.log("📋 Fetching all chat sessions...");

    const response = await fetch(`${NEXT_API_BASE}/sessions`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("Get sessions response status:", response.status);

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        console.log(
          "No sessions found or unauthorized - returning empty array"
        );
        return [];
      }
      await handleApiError(response, "fetch chat sessions");
    }

    const data = await response.json();
    console.log(
      `✅ Received ${Array.isArray(data) ? data.length : 0} sessions`
    );

    const sessionsData = Array.isArray(data) ? data : [];

    return sessionsData.map((session: any, index: number) => {
      const createdAt = session.createdAt
        ? new Date(session.createdAt)
        : new Date(Date.now() - index * 1000 * 60 * 60 * 24);

      const updatedAt = session.updatedAt
        ? new Date(session.updatedAt)
        : createdAt;

      return {
        id:
          session.id || session.sessionId || session._id || `session-${index}`,
        sessionId:
          session.sessionId || session.id || session._id || `session-${index}`,
        title: session.title || `Chat ${index + 1}`,
        createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
        messageCount: session.messageCount || session.messages?.length || 0,
        lastMessage:
          session.lastMessage ||
          (session.messages && session.messages.length > 0
            ? session.messages[session.messages.length - 1]?.content?.substring(
                0,
                50
              ) + "..."
            : ""),
        messages: session.messages || [],
      };
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);

    return [];
  }
};

export const getChatSessionById = async (
  sessionId: string
): Promise<ChatSession | null> => {
  try {
    console.log(`🔍 Fetching session ${sessionId}...`);

    if (!sessionId || sessionId === "undefined") {
      return null;
    }

    const allSessions = await getAllChatSessions();

    const session = allSessions.find(
      (s) =>
        s.sessionId === sessionId || s.id === sessionId || s._id === sessionId
    );

    if (session) {
      const messages = await getChatHistory(sessionId);
      return {
        ...session,
        messages,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching session ${sessionId}:`, error);
    return null;
  }
};

export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log("🔌 Testing API connection...");

    try {
      const sessions = await getAllChatSessions();
      console.log(
        `✅ API connection test passed. Found ${sessions.length} sessions.`
      );
      return true;
    } catch (error) {
      const response = await fetch("/api/chat/sessions", {
        method: "GET",
      });

      if (response.ok || response.status === 404 || response.status === 401) {
        console.log("✅ API is responding (status:", response.status, ")");
        return true;
      }

      console.error("❌ API test failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ API connection test failed:", error);
    return false;
  }
};

export const debugChatApi = async (): Promise<any> => {
  try {
    console.log("🐛 Debugging chat API...");

    const results = {
      testConnection: await testApiConnection(),
      currentSessionId:
        typeof window !== "undefined"
          ? localStorage.getItem("currentSessionId")
          : "Not in browser",
      backendUrl: process.env.BACKEND_API_URL || "http://localhost:3001",
      apiBase: NEXT_API_BASE,
    };

    console.log("Debug results:", results);
    return results;
  } catch (error) {
    console.error("Debug failed:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getCurrentSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentSessionId");
};

export const setCurrentSessionId = (sessionId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("currentSessionId", sessionId);
  console.log("Set current session ID:", sessionId);
};

export const initializeChat = async (): Promise<{
  sessionId: string;
  isNew: boolean;
  existingMessages: ChatMessage[];
}> => {
  try {
    let sessionId = getCurrentSessionId();
    let isNew = false;
    let existingMessages: ChatMessage[] = [];

    if (!sessionId || sessionId === "undefined") {
      console.log("No existing session, creating new one...");
      const newSession = await createChatSession();
      sessionId = newSession.sessionId;
      setCurrentSessionId(sessionId);
      isNew = true;
    } else {
      console.log("Loading existing session:", sessionId);
      existingMessages = await getChatHistory(sessionId);
      console.log(`Found ${existingMessages.length} existing messages`);
    }

    return { sessionId, isNew, existingMessages };
  } catch (error) {
    console.error("Error initializing chat:", error);

    const newSession = await createChatSession();
    return {
      sessionId: newSession.sessionId,
      isNew: true,
      existingMessages: [],
    };
  }
};
