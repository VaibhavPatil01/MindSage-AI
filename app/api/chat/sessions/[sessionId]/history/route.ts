// mindsageai/app/api/chat/sessions/[sessionId]/history/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> } // Fixed: params is a Promise
) {
  try {
    // Await params in Next.js 15
    const { sessionId } = await params;
    console.log(`[API] Getting chat history for session: ${sessionId}`);
    console.log(`[API] Backend URL: ${BACKEND_API_URL}`);
    
    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      console.error(`[API] Invalid sessionId: ${sessionId}`);
      return NextResponse.json(
        { 
          error: "Invalid session ID",
          sessionId,
          suggestion: "Create a new session first"
        },
        { status: 400 }
      );
    }

    // Get auth header if available
    const authHeader = req.headers.get("Authorization");
    console.log(`[API] Auth header present: ${!!authHeader}`);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-By": "nextjs-api-route"
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    console.log(`[API] Fetching from backend: ${BACKEND_API_URL}/chat/sessions/${sessionId}/history`);
    
    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers,
      }
    );

    console.log(`[API] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get the error response as text first
      const errorText = await response.text();
      console.error(`[API] Backend error ${response.status}:`, errorText.substring(0, 500));
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If not JSON, it might be HTML or plain text
        if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
          console.error("[API] ❌ Backend returned HTML! Likely 404 or auth redirect.");
          errorData = { 
            error: "Backend returned HTML (check if session exists)",
            raw: errorText.substring(0, 200)
          };
        } else {
          errorData = { 
            error: `Backend error ${response.status}: ${errorText.substring(0, 100)}` 
          };
        }
      }
      
      // Return appropriate error based on status
      if (response.status === 404) {
        console.log(`[API] Session ${sessionId} not found, returning empty array`);
        // Return empty array instead of error for 404
        return NextResponse.json([], {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          }
        });
      } else if (response.status === 403) {
        return NextResponse.json(
          { 
            error: "Unauthorized to access this session",
            sessionId,
            backendError: errorData
          },
          { status: 403 }
        );
      }
      
      // For other errors, still return empty array so frontend doesn't break
      console.log(`[API] Backend error ${response.status}, returning empty array`);
      return NextResponse.json([], {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
      });
    }

    const data = await response.json();
    console.log(`[API] Backend returned data type:`, typeof data);
    console.log(`[API] Data keys:`, Object.keys(data));
    
    // Handle different response formats from backend
    let messages = [];
    
    if (Array.isArray(data)) {
      // Backend returned direct array of messages
      messages = data;
      console.log(`[API] Found ${messages.length} messages directly in array`);
    } else if (data.messages && Array.isArray(data.messages)) {
      // Backend returned { messages: [...] }
      messages = data.messages;
      console.log(`[API] Found ${messages.length} messages in data.messages`);
    } else if (data && typeof data === 'object') {
      // Try to find any array in the object
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        messages = data[arrayKeys[0]];
        console.log(`[API] Found ${messages.length} messages in key: ${arrayKeys[0]}`);
      } else {
        console.log(`[API] No array found in response object. Keys:`, Object.keys(data));
        messages = [];
      }
    } else {
      console.log(`[API] Unexpected response format:`, typeof data);
      messages = [];
    }

    // Format the response to match frontend expectations
    const formattedMessages = messages.map((msg: any, index: number) => ({
      role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
      content: msg.content || msg.text || msg.message || "",
      timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
      _id: msg._id || `msg-${index}`,
      metadata: msg.metadata || (msg.analysis ? { analysis: msg.analysis } : undefined),
    }));

    console.log(`[API] Returning ${formattedMessages.length} formatted messages`);
    
    return NextResponse.json(formattedMessages, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      }
    });
    
  } catch (error) {
    console.error("[API] Unexpected error getting chat history:", error);
    
    // Return empty array on any error
    return NextResponse.json([], {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      }
    });
  }
}

// Add OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    { message: "CORS preflight check" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}