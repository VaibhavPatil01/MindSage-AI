// mindsageai/app/api/chat/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

// GET all chat sessions for the user
export async function GET(req: NextRequest) {
  console.log(`[API SESSIONS] Getting all chat sessions for user`);
  console.log(`[API SESSIONS] Backend URL: ${BACKEND_API_URL}`);
  
  try {
    const authHeader = req.headers.get("Authorization");
    console.log(`[API SESSIONS] Auth header present: ${!!authHeader}`);
    
    // Prepare headers for backend request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-By": "nextjs-api-route",
      // Try to get user ID from cookies if no auth header
      ...(req.headers.get("Cookie") && { 
        "Cookie": req.headers.get("Cookie")! 
      })
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else {
      console.log(`[API SESSIONS] No auth header - checking for user in session/cookies`);
      // Check if we have user info in headers
      const userId = req.headers.get("X-User-Id");
      if (userId) {
        headers["X-User-Id"] = userId;
      }
    }
    
    console.log(`[API SESSIONS] Sending GET request to: ${BACKEND_API_URL}/chat/sessions`);
    console.log(`[API SESSIONS] Headers:`, Object.keys(headers));
    
    const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
      method: "GET",
      headers,
    });

    console.log(`[API SESSIONS] Backend response status: ${response.status}`);
    console.log(`[API SESSIONS] Backend response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // Try to parse error response
      const errorText = await response.text();
      console.error(`[API SESSIONS] Backend error ${response.status}:`, errorText.substring(0, 500));
      
      // If 404 or no content, return empty array (no sessions yet)
      if (response.status === 404 || response.status === 204) {
        console.log(`[API SESSIONS] No sessions found (${response.status}) - returning empty array`);
        return NextResponse.json([], {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          }
        });
      }
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          error: `Backend returned ${response.status}: ${errorText.substring(0, 100)}`
        };
      }
      
      // If auth error, return empty array instead of error
      if (response.status === 401 || response.status === 403) {
        console.log(`[API SESSIONS] Auth error (${response.status}) - returning empty array`);
        return NextResponse.json([], {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          }
        });
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch chat sessions",
          backendError: errorData,
          statusCode: response.status
        },
        { 
          status: response.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[API SESSIONS] Failed to parse backend response:`, parseError);
      // If empty response or parse error, return empty array
      return NextResponse.json([], {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
      });
    }
    
    console.log(`[API SESSIONS] Found ${Array.isArray(data) ? data.length : 0} sessions`);
    
    // Ensure we always return an array
    let sessions = [];
    if (Array.isArray(data)) {
      sessions = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.sessions)) {
        sessions = data.sessions;
      } else if (Array.isArray(data.data)) {
        sessions = data.data;
      } else {
        // Try to extract array from object
        const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
        sessions = arrayKey ? data[arrayKey] : [];
      }
    }
    
    // Format sessions for frontend
    const formattedSessions = sessions.map((session: any, index: number) => ({
      id: session._id || session.id || `session-${index}`,
      sessionId: session._id || session.id || `session-${index}`,
      title: session.title || `Chat ${index + 1}`,
      createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
      messageCount: session.messageCount || session.messages?.length || 0,
      lastMessage: session.lastMessage || (session.messages && session.messages.length > 0 
        ? session.messages[session.messages.length - 1]?.content?.substring(0, 50) + '...'
        : ''),
    }));
    
    console.log(`[API SESSIONS] Returning ${formattedSessions.length} formatted sessions`);
    
    return NextResponse.json(formattedSessions, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      }
    });
    
  } catch (error) {
    console.error(`[API SESSIONS] Unexpected error in GET:`, error);
    
    // Network error - backend might be down
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`[API SESSIONS] Network error - Backend might be down at ${BACKEND_API_URL}`);
      // Return empty array instead of error so frontend still works
      return NextResponse.json([], {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
      });
    }
    
    // Return empty array on any error to keep frontend working
    return NextResponse.json([], {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      }
    });
  }
}

// POST - Create new chat session
export async function POST(req: NextRequest) {
  console.log(`[API SESSIONS] Creating new chat session...`);
  console.log(`[API SESSIONS] Backend URL: ${BACKEND_API_URL}`);
  
  try {
    const authHeader = req.headers.get("Authorization");
    console.log(`[API SESSIONS] Auth header present: ${!!authHeader}`);
    
    // Parse request body for session title
    let body;
    try {
      body = await req.json();
      console.log(`[API SESSIONS] Request body:`, body);
    } catch (parseError) {
      console.log(`[API SESSIONS] No body or invalid JSON, using default title`);
      body = { title: "New Chat" };
    }
    
    const title = body.title || "New Chat";
    
    // Prepare headers for backend request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-By": "nextjs-api-route"
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else {
      console.log(`[API SESSIONS] Warning: No auth header. Backend might reject or use test user.`);
    }
    
    console.log(`[API SESSIONS] Creating session with title: "${title}"`);
    console.log(`[API SESSIONS] Sending request to: ${BACKEND_API_URL}/chat/sessions`);
    
    const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    });

    console.log(`[API SESSIONS] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to parse error response
      const errorText = await response.text();
      console.error(`[API SESSIONS] Backend error ${response.status}:`, errorText.substring(0, 500));
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          error: `Backend returned ${response.status}: ${errorText.substring(0, 100)}`
        };
      }
      
      // Provide helpful error messages based on status
      let userMessage = "Failed to create chat session";
      let statusCode = response.status;
      
      if (response.status === 401) {
        userMessage = "Authentication required. Please log in first.";
      } else if (response.status === 400) {
        userMessage = "Invalid request to create chat session";
      } else if (response.status === 500) {
        userMessage = "Server error while creating chat session";
      }
      
      return NextResponse.json(
        { 
          error: userMessage,
          backendError: errorData,
          statusCode,
          suggestion: response.status === 401 ? "Check your authentication token" : "Try again later"
        },
        { 
          status: statusCode,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[API SESSIONS] Failed to parse backend response:`, parseError);
      // Create a mock session if backend returns invalid JSON
      data = {
        _id: `session-${Date.now()}`,
        title: title,
        createdAt: new Date().toISOString(),
        message: "Session created (mock - backend returned invalid response)"
      };
    }
    
    console.log(`[API SESSIONS] Session created successfully:`, {
      sessionId: data._id || data.sessionId,
      title: data.title,
      hasWarning: !!data.warning
    });
    
    // Ensure session has required fields
    const sessionResponse = {
      ...data,
      id: data._id || data.id || data.sessionId || `session-${Date.now()}`,
      sessionId: data._id || data.sessionId || data.id || `session-${Date.now()}`,
      title: data.title || title,
      createdAt: data.createdAt || new Date().toISOString(),
      _meta: {
        createdVia: "nextjs-api-route",
        timestamp: new Date().toISOString(),
        backend: BACKEND_API_URL
      }
    };
    
    return NextResponse.json(sessionResponse, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      }
    });
    
  } catch (error) {
    console.error(`[API SESSIONS] Unexpected error in POST:`, error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`[API SESSIONS] Network error - Backend might be down at ${BACKEND_API_URL}`);
      // Create a mock session so frontend can still work
      const mockSession = {
        id: `mock-session-${Date.now()}`,
        sessionId: `mock-session-${Date.now()}`,
        title: "New Chat (Offline Mode)",
        createdAt: new Date().toISOString(),
        message: "Created in offline mode - backend unreachable",
        _meta: {
          isMock: true,
          backendUnreachable: true,
          backendUrl: BACKEND_API_URL
        }
      };
      
      return NextResponse.json(mockSession, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
      });
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
      }
    );
  }
}

// OPTIONS for CORS preflight
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