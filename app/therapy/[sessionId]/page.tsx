// mindsageai/app/therapy/[sessionId]/page.tsx

"use client";

import { useEffect, useRef, useState, use } from "react"; // Add 'use' import
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  X,
  Trophy,
  Star,
  Clock,
  Smile,
  PlusCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BreathingGame } from "@/components/games/breathing-game";
import { ZenGarden } from "@/components/games/zen-garden";
import { ForestGame } from "@/components/games/forest-game";
import { OceanWaves } from "@/components/games/ocean-waves";
import { Badge } from "@/components/ui/badge";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  ChatMessage,
  getAllChatSessions,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface StressPrompt {
  trigger: string;
  activity: {
    type: "breathing" | "garden" | "forest" | "waves";
    title: string;
    description: string;
  };
}

interface ApiResponse {
  message: string;
  metadata: {
    technique: string;
    goal: string;
    progress: any[];
  };
}

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const COMPLETION_THRESHOLD = 5;

export default function TherapyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  // Use the 'use' hook to unwrap the params Promise
  const unwrappedParams = use(params);
  const sessionIdFromParams = unwrappedParams.sessionId;
  
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stressPrompt, setStressPrompt] = useState<StressPrompt | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [showNFTCelebration, setShowNFTCelebration] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  
  // Use state for sessionId to handle both param and created sessions
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Initialize sessionId from params
  useEffect(() => {
    if (sessionIdFromParams && sessionIdFromParams !== "undefined" && sessionIdFromParams !== "null") {
      console.log("[Page] Setting sessionId from params:", sessionIdFromParams);
      setSessionId(sessionIdFromParams);
    } else {
      console.log("[Page] Invalid sessionId from params:", sessionIdFromParams);
    }
  }, [sessionIdFromParams]);

  // Helper function to load chat history with better error handling
  const loadChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      console.log(`[Page] Loading chat history for session: ${sessionId}`);
      
      if (!sessionId || sessionId === "undefined" || sessionId === "null") {
        console.error(`[Page] Invalid sessionId: ${sessionId}`);
        return [];
      }
      
      const history = await getChatHistory(sessionId);
      
      console.log(`[Page] Raw history received:`, {
        type: typeof history,
        isArray: Array.isArray(history),
        length: Array.isArray(history) ? history.length : 'N/A'
      });
      
      if (Array.isArray(history)) {
        // Format messages properly
        const formattedHistory = history.map((msg: any, index: number) => ({
          role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
          content: msg.content || msg.text || msg.message || "",
          timestamp: new Date(msg.timestamp || Date.now()),
          metadata: msg.metadata || (msg.analysis ? { analysis: msg.analysis } : undefined),
          _id: msg._id || `msg-${index}`,
        }));
        
        console.log(`[Page] Formatted ${formattedHistory.length} messages`);
        return formattedHistory;
      } else {
        console.error(`[Page] History is not an array:`, history);
        return [];
      }
    } catch (error) {
      console.error(`[Page] Error loading chat history:`, error);
      
      // Check if it's a specific error
      if (error instanceof Error) {
        if (error.message.includes("404") || error.message.includes("not found")) {
          console.log(`[Page] Session ${sessionId} not found`);
          // Return empty array - the session might not exist
          return [];
        }
      }
      
      // Return empty array to prevent breaking
      return [];
    }
  };

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      console.log("[Page] Creating new chat session...");
      
      const newSession = await createChatSession();
      console.log("[Page] New session created:", newSession);
      
      const newSessionId = newSession.sessionId || newSession.id;
      if (!newSessionId) {
        throw new Error("No session ID returned from createChatSession");
      }

      // Update sessions list immediately
      const sessionData: ChatSession = {
        id: newSession.id || newSessionId,
        sessionId: newSessionId,
        title: newSession.title || "New Chat",
        createdAt: newSession.createdAt || new Date(),
        updatedAt: newSession.updatedAt || newSession.createdAt || new Date(),
        messageCount: 0,
        messages: [],
      };

      // Update all state in one go
      setSessions((prev) => [sessionData, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);

      // Update URL without refresh
      window.history.pushState({}, "", `/therapy/${newSessionId}`);
      
      console.log("[Page] New session setup complete");
    } catch (error) {
      console.error("[Page] Failed to create new session:", error);
      
      // Show error to user
      setMessages([
        {
          role: "assistant",
          content: "I couldn't create a new session. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize chat session and load history
  useEffect(() => {
    const initChat = async () => {
      // Don't run if we don't have a sessionId yet
      if (!sessionId) {
        console.log("[Page] No sessionId yet, waiting...");
        return;
      }
      
      try {
        setIsLoading(true);
        console.log(`[Page] Initializing chat with sessionId: ${sessionId}`);
        
        // Check if sessionId is "new" or invalid
        if (sessionId === "new" || sessionId === "undefined" || sessionId === "null") {
          console.log("[Page] Creating new chat session...");
          const newSession = await createChatSession();
          const newSessionId = newSession.sessionId || newSession.id;
          if (newSessionId) {
            console.log("[Page] New session created:", newSessionId);
            setSessionId(newSessionId);
            window.history.pushState({}, "", `/therapy/${newSessionId}`);
            setMessages([]); // Clear messages for new session
          } else {
            throw new Error("Failed to get session ID from createChatSession");
          }
        } else {
          console.log("[Page] Loading existing chat session:", sessionId);
          
          // Use the helper function
          const history = await loadChatHistory(sessionId);
          
          console.log("[Page] Loaded history:", history.length, "messages");
          
          if (history.length > 0) {
            setMessages(history);
          } else {
            console.log("[Page] No messages found, showing empty chat");
            // If no messages but we have a valid sessionId, keep it
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("[Page] Failed to initialize chat:", error);
        
        // Show user-friendly error and create new session
        try {
          const newSession = await createChatSession();
          const newSessionId = newSession.sessionId || newSession.id;
          if (newSessionId) {
            setSessionId(newSessionId);
            window.history.pushState({}, "", `/therapy/${newSessionId}`);
          }
          
          setMessages([
            {
              role: "assistant",
              content: "Welcome! I'm here to support you. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        } catch (createError) {
          console.error("[Page] Failed to create fallback session:", createError);
        }
      } finally {
        setIsLoading(false);
        console.log("[Page] Chat initialization complete");
      }
    };

    initChat();
  }, [sessionId]);

  // Load all chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        console.log("[Page] Loading all chat sessions...");
        const allSessions = await getAllChatSessions();
        console.log(`[Page] Loaded ${allSessions.length} sessions`);
        setSessions(allSessions);
      } catch (error) {
        console.error("[Page] Failed to load sessions:", error);
        // Don't show error to user, just log it
      }
    };

    loadSessions();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Page] Form submitted");
    const currentMessage = message.trim();
    console.log("[Page] Current message:", currentMessage);
    console.log("[Page] Session ID:", sessionId);
    console.log("[Page] Is typing:", isTyping);
    console.log("[Page] Is chat paused:", isChatPaused);

    if (!currentMessage || isTyping || isChatPaused || !sessionId) {
      console.log("[Page] Submission blocked:", {
        noMessage: !currentMessage,
        isTyping,
        isChatPaused,
        noSessionId: !sessionId,
      });
      return;
    }

    setMessage("");
    setIsTyping(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        role: "user",
        content: currentMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Check for stress signals
      const stressCheck = detectStressSignals(currentMessage);
      if (stressCheck) {
        setStressPrompt(stressCheck);
        setIsTyping(false);
        return;
      }

      console.log("[Page] Sending message to API...");
      
      // Send message to API
      const response = await sendChatMessage(sessionId, currentMessage);
      console.log("[Page] Raw API response:", response);

      // Handle the response - check if it's an error
      if (response && typeof response === 'object' && 'error' in response) {
        console.error("[Page] API returned error:", response);
        
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Parse the response if it's a string
      const aiResponse = typeof response === "string" ? JSON.parse(response) : response;
      console.log("[Page] Parsed AI response:", aiResponse);

      // Add AI response with metadata
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "I'm here to support you. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        metadata: {
          analysis: aiResponse.analysis || {
            emotionalState: "neutral",
            riskLevel: 0,
            themes: [],
            recommendedApproach: "supportive",
            progressIndicators: [],
          },
          technique: aiResponse.metadata?.technique || "supportive",
          goal: aiResponse.metadata?.currentGoal || "Provide support",
          progress: aiResponse.metadata?.progress || {
            emotionalState: "neutral",
            riskLevel: 0,
          },
        },
      };

      console.log("[Page] Created assistant message:", assistantMessage);

      // Add the message immediately
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("[Page] Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading while initializing
  if (!mounted || (isLoading && !sessionId)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">
          {isLoading ? "Loading chat..." : "Initializing..."}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Session ID: {sessionId || "creating new..."}
        </p>
      </div>
    );
  }

  const detectStressSignals = (message: string): StressPrompt | null => {
    const stressKeywords = [
      "stress",
      "anxiety",
      "worried",
      "panic",
      "overwhelmed",
      "nervous",
      "tense",
      "pressure",
      "can't cope",
      "exhausted",
    ];

    const lowercaseMsg = message.toLowerCase();
    const foundKeyword = stressKeywords.find((keyword) =>
      lowercaseMsg.includes(keyword)
    );

    if (foundKeyword) {
      const activities = [
        {
          type: "breathing" as const,
          title: "Breathing Exercise",
          description:
            "Follow calming breathing exercises with visual guidance",
        },
        {
          type: "garden" as const,
          title: "Zen Garden",
          description: "Create and maintain your digital peaceful space",
        },
        {
          type: "forest" as const,
          title: "Mindful Forest",
          description: "Take a peaceful walk through a virtual forest",
        },
        {
          type: "waves" as const,
          title: "Ocean Waves",
          description: "Match your breath with gentle ocean waves",
        },
      ];

      return {
        trigger: foundKeyword,
        activity: activities[Math.floor(Math.random() * activities.length)],
      };
    }

    return null;
  };

  const handleSuggestedQuestion = async (text: string) => {
    console.log("[Page] Handling suggested question:", text);
    
    if (!sessionId) {
      console.log("[Page] No session ID, creating new session...");
      try {
        await handleNewSession();
        // Wait a moment for the session to be created
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("[Page] Failed to create session:", error);
        return;
      }
    }

    setMessage(text);
    // Trigger the form submission
    setTimeout(() => {
      const fakeEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      handleSubmit(fakeEvent);
    }, 50);
  };

  const handleCompleteSession = async () => {
    if (isCompletingSession) return;
    setIsCompletingSession(true);
    try {
      setShowNFTCelebration(true);
    } catch (error) {
      console.error("Error completing session:", error);
    } finally {
      setIsCompletingSession(false);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    // Don't do anything if we're already on this session
    if (selectedSessionId === sessionId) {
      console.log(`[Page] Already on session ${selectedSessionId}`);
      return;
    }

    console.log(`[Page] Switching to session: ${selectedSessionId}`);
    
    try {
      setIsLoading(true);
      
      // First, check if this session exists in our sessions list
      const sessionExists = sessions.some(s => s.sessionId === selectedSessionId);
      
      if (!sessionExists) {
        console.log(`[Page] Session ${selectedSessionId} not found in sessions list`);
        // Show a message that the session might not exist
        setMessages([
          {
            role: "assistant",
            content: "This session might not exist or you don't have access to it.",
            timestamp: new Date(),
          },
        ]);
        setSessionId(selectedSessionId);
        window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
        setIsLoading(false);
        return;
      }
      
      // Load chat history for the selected session
      const history = await loadChatHistory(selectedSessionId);
      
      console.log(`[Page] Loaded ${history.length} messages for session ${selectedSessionId}`);
      
      // Update the URL and state - ALWAYS switch to the selected session
      setSessionId(selectedSessionId);
      window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
      
      // Set the messages (even if empty array)
      setMessages(history);
      
      console.log(`[Page] Switched to session ${selectedSessionId}`);
    } catch (error) {
      console.error("[Page] Failed to load session:", error);
      
      // Show error message to user
      setMessages([
        {
          role: "assistant",
          content: "I couldn't load that chat session. The session might not exist.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get display session ID - handle null/undefined
  const displaySessionId = sessionId || "new";
  const displaySessionIdShort = typeof displaySessionId === 'string' 
    ? displaySessionId.slice(0, 8)
    : "new";

  return (
    <div className="relative max-w-7xl mx-auto px-4">
      <div className="flex h-[calc(100vh-4rem)] mt-20 gap-6">
        {/* Sidebar with chat history */}
        <div className="w-80 flex flex-col border-r bg-muted/30">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chat Sessions</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                className="hover:bg-primary/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleNewSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              New Session
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4  overflow-hidden">
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No chat sessions yet</p>
                  <p className="text-sm">Start a new chat to begin</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={cn(
                      "p-3  rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors",
                      session.sessionId === sessionId
                        ? "bg-primary/10 text-primary "
                        : "bg-secondary/10 "
                    )}
                    onClick={() => handleSessionSelect(session.sessionId)}
                  >
                    <div className="flex items-center  gap-2 mb-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">
                        {session.title || session.messages[0]?.content?.slice(0, 30) || "New Chat"}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-muted-foreground">
                      {session.messages && session.messages.length > 0 
                        ? session.messages[session.messages.length - 1]?.content || "No messages yet"
                        : "No messages yet"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {session.messageCount || session.messages?.length || 0} messages
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(session.updatedAt || session.createdAt || Date.now());
                            if (isNaN(date.getTime())) {
                              return "Just now";
                            }
                            return formatDistanceToNow(date, {
                              addSuffix: true,
                            });
                          } catch (error) {
                            return "Just now";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background rounded-lg border">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Therapist</h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} messages • Session: {displaySessionIdShort}...
                </p>
              </div>
            </div>
          </div>

          {messages.length === 0 && !isLoading ? (
            // Welcome screen with suggested questions
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      initial="initial"
                      animate="animate"
                      variants={glowAnimation}
                    />
                    <div className="relative flex items-center gap-2 text-2xl font-semibold">
                      <div className="relative">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <motion.div
                          className="absolute inset-0 text-primary"
                          initial="initial"
                          animate="animate"
                          variants={glowAnimation}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </div>
                      <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                        AI Therapist
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      How can I assist you today?
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 relative">
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-b from-primary/5 to-transparent blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                  {SUGGESTED_QUESTIONS.map((q, index) => (
                    <motion.div
                      key={q.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50 transition-all duration-300"
                        onClick={() => handleSuggestedQuestion(q.text)}
                      >
                        {q.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    
                    <motion.div
                      key={msg.timestamp?.toISOString() + msg.content?.slice(0, 10) + index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "px-6 py-8",
                        msg.role === "assistant"
                          ? "bg-muted/30"
                          : "bg-background"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 overflow-hidden min-h-[2rem]">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {msg.role === "assistant"
                                ? "AI Therapist"
                                : "You"}
                            </p>
                            {msg.metadata?.technique && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.metadata.technique}
                              </Badge>
                            )}
                          </div>
                          <div className="prose prose-sm dark:prose-invert leading-relaxed">
                            <ReactMarkdown>{msg.content || ""}</ReactMarkdown>
                          </div>
                          {msg.metadata?.goal && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Goal: {msg.metadata.goal}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-8 flex gap-4 bg-muted/30"
                  >
                    <div className="w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">AI Therapist</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-4">
            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto flex gap-4 items-end relative"
            >
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isChatPaused
                      ? "Complete the activity to continue..."
                      : "Ask me anything..."
                  }
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3 pr-12 min-h-[48px] max-h-[200px]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || isChatPaused) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  rows={1}
                  disabled={isTyping || isChatPaused}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-1.5 bottom-3.5 h-[36px] w-[36px]",
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90",
                    "shadow-sm shadow-primary/20",
                    (isTyping || isChatPaused || !message.trim()) &&
                      "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105"
                  )}
                  disabled={isTyping || isChatPaused || !message.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              to send,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">
                Shift + Enter
              </kbd>{" "}
              for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}