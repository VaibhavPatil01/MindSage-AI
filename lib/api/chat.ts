// mindsageai/lib/api/chat.ts
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

// IMPORTANT: Changed to use Next.js API routes, NOT backend directly
const NEXT_API_BASE = "/api/chat"; // Relative URL to Next.js API routes

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  // Try to get token from localStorage (for web) or cookies (for SSR)
  let token = "";
  
  if (typeof window !== "undefined") {
    // Client-side: get from localStorage
    token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  }
  
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    // Add a header to identify this as a browser request
    "X-Requested-With": "XMLHttpRequest",
  };
};

// Helper to handle API errors consistently
const handleApiError = async (response: Response, context: string) => {
  const errorText = await response.text();
  console.error(`❌ ${context} failed. Status: ${response.status}`, errorText.substring(0, 200));
  
  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch {
    // If not JSON, it's probably HTML or plain text
    if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
      console.error("❌ Received HTML instead of JSON!");
      errorData = { 
        error: `Server returned HTML (likely 404 or redirect)`,
        raw: errorText.substring(0, 100)
      };
    } else {
      errorData = { 
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` 
      };
    }
  }
  
  throw new Error(errorData.error || errorData.message || `Failed to ${context}`);
};

export const createChatSession = async (title?: string): Promise<ChatSession> => {
  try {
    console.log("Creating new chat session via Next.js API...");
    
    const response = await fetch(`${NEXT_API_BASE}/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        title: title || "New Chat",
        createdAt: new Date().toISOString()
      }),
    });

    console.log("Create session response status:", response.status);
    
    if (!response.ok) {
      await handleApiError(response, "create chat session");
    }

    const data = await response.json();
    console.log("✅ Chat session created:", data);
    
    // Ensure the response has required fields
    const sessionData: ChatSession = {
      id: data.id || data.sessionId || data._id || `session-${Date.now()}`,
      sessionId: data.sessionId || data.id || data._id || `session-${Date.now()}`,
      title: data.title || "New Chat",
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
      messageCount: data.messageCount || 0,
      lastMessage: data.lastMessage || "",
      messages: data.messages || [],
    };
    
    // Store the session ID in localStorage for future use
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
    console.log(`📤 Sending message to session ${sessionId}:`, message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    if (!sessionId || sessionId === "undefined") {
      // If no session, create one first
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
          timestamp: new Date().toISOString()
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
    
    // If it's a session not found error, create new session and retry
    if (error instanceof Error && error.message.includes("session") && error.message.includes("not found")) {
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
      // Don't throw error for 404 - just return empty array
      if (response.status === 404) {
        console.log("No chat history found (404)");
        return [];
      }
      await handleApiError(response, "fetch chat history");
    }

    const data = await response.json();
    console.log(`✅ Received ${Array.isArray(data) ? data.length : 0} messages`);
    
    // Handle different response formats
    let messages: any[] = [];
    
    if (Array.isArray(data)) {
      messages = data;
    } else if (data.messages && Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (data && typeof data === 'object') {
      // Try to extract messages from object
      const arrayValues = Object.values(data).filter(val => Array.isArray(val));
      messages = arrayValues.length > 0 ? arrayValues[0] : [];
    }
    
    if (!Array.isArray(messages)) {
      console.error("Invalid chat history format:", data);
      return [];
    }

    // Format messages for frontend
    return messages.map((msg: any, index: number) => ({
      role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant') || (index % 2 === 0 ? 'user' : 'assistant'),
      content: msg.content || msg.text || msg.message || "",
      timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
      metadata: msg.metadata || (msg.analysis ? { analysis: msg.analysis } : undefined),
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
      // Don't throw error - return empty array instead
      if (response.status === 404 || response.status === 401) {
        console.log("No sessions found or unauthorized - returning empty array");
        return [];
      }
      await handleApiError(response, "fetch chat sessions");
    }

    const data = await response.json();
    console.log(`✅ Received ${Array.isArray(data) ? data.length : 0} sessions`);
    
    // Ensure data is an array
    const sessionsData = Array.isArray(data) ? data : [];
    
    // Format sessions for frontend
    return sessionsData.map((session: any, index: number) => {
      // Parse dates carefully
      const createdAt = session.createdAt 
        ? new Date(session.createdAt)
        : new Date(Date.now() - (index * 1000 * 60 * 60 * 24)); // Stagger dates if not provided
      
      const updatedAt = session.updatedAt 
        ? new Date(session.updatedAt)
        : createdAt;
      
      return {
        id: session.id || session.sessionId || session._id || `session-${index}`,
        sessionId: session.sessionId || session.id || session._id || `session-${index}`,
        title: session.title || `Chat ${index + 1}`,
        createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
        messageCount: session.messageCount || session.messages?.length || 0,
        lastMessage: session.lastMessage || (session.messages && session.messages.length > 0 
          ? session.messages[session.messages.length - 1]?.content?.substring(0, 50) + '...'
          : ''),
        messages: session.messages || [],
      };
    });
    
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    // Return empty array on error so UI doesn't break
    return [];
  }
};

export const getChatSessionById = async (sessionId: string): Promise<ChatSession | null> => {
  try {
    console.log(`🔍 Fetching session ${sessionId}...`);
    
    if (!sessionId || sessionId === "undefined") {
      return null;
    }
    
    // First get all sessions
    const allSessions = await getAllChatSessions();
    
    // Find the specific session
    const session = allSessions.find(s => 
      s.sessionId === sessionId || 
      s.id === sessionId || 
      s._id === sessionId
    );
    
    if (session) {
      // Get messages for this session
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

// Test function to verify the API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log("🔌 Testing API connection...");
    
    // Test if we can create and list sessions
    try {
      const sessions = await getAllChatSessions();
      console.log(`✅ API connection test passed. Found ${sessions.length} sessions.`);
      return true;
    } catch (error) {
      // Try a simpler test - just fetch the API
      const response = await fetch("/api/chat/sessions", {
        method: "GET",
      });
      
      if (response.ok || response.status === 404 || response.status === 401) {
        // Even 404/401 means API is responding
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

// Debug function
export const debugChatApi = async (): Promise<any> => {
  try {
    console.log("🐛 Debugging chat API...");
    
    const results = {
      testConnection: await testApiConnection(),
      currentSessionId: typeof window !== "undefined" ? localStorage.getItem("currentSessionId") : "Not in browser",
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

// Helper to get current session ID
export const getCurrentSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentSessionId");
};

// Helper to set current session ID
export const setCurrentSessionId = (sessionId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("currentSessionId", sessionId);
  console.log("Set current session ID:", sessionId);
};

// Initialize chat - creates session if none exists
export const initializeChat = async (): Promise<{
  sessionId: string;
  isNew: boolean;
  existingMessages: ChatMessage[];
}> => {
  try {
    // Check for existing session
    let sessionId = getCurrentSessionId();
    let isNew = false;
    let existingMessages: ChatMessage[] = [];
    
    if (!sessionId || sessionId === "undefined") {
      // Create new session
      console.log("No existing session, creating new one...");
      const newSession = await createChatSession();
      sessionId = newSession.sessionId;
      setCurrentSessionId(sessionId);
      isNew = true;
    } else {
      // Load existing messages
      console.log("Loading existing session:", sessionId);
      existingMessages = await getChatHistory(sessionId);
      console.log(`Found ${existingMessages.length} existing messages`);
    }
    
    return { sessionId, isNew, existingMessages };
  } catch (error) {
    console.error("Error initializing chat:", error);
    // Create new session as fallback
    const newSession = await createChatSession();
    return {
      sessionId: newSession.sessionId,
      isNew: true,
      existingMessages: [],
    };
  }
};