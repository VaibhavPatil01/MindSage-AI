// mindsageai/app/api/sessions/[sessionId]/messages/route.ts

import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> } // Note: params is a Promise in Next.js 15
) {
  console.log(`=== CHAT API CALLED ===`);
  console.log(`URL: ${req.url}`);
  console.log(`Method: ${req.method}`);
  
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    console.log(`Session ID from params:`, resolvedParams);
    
    const { sessionId } = resolvedParams;
    console.log(`Processing message for session: ${sessionId}`);
    
    // Validate sessionId
    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      console.error(`Invalid sessionId: ${sessionId}`);
      return NextResponse.json(
        { 
          error: "Invalid session ID",
          message: "Session ID is missing or invalid. Please create a session first.",
          receivedSessionId: sessionId
        },
        { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        }
      );
    }

    // Validate sessionId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      console.warn(`Session ID does not match UUID format: ${sessionId}`);
      // Don't reject it, just log warning as it might be a different format
    }
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log(`Request body:`, body);
    } catch (parseError) {
      console.error(`Failed to parse request body:`, parseError);
      return NextResponse.json(
        { 
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown error"
        },
        { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        }
      );
    }
    
    const { message } = body;

    if (!message || typeof message !== 'string') {
      console.error(`Message is missing or invalid in request body`);
      return NextResponse.json(
        { 
          error: "Message is required and must be a string",
          receivedBody: body 
        },
        { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          }
        }
      );
    }

    console.log(`Forwarding to backend: ${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`);
    console.log(`Message content: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    
    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward any authorization headers from the original request
          ...(req.headers.get("Authorization") && { 
            "Authorization": req.headers.get("Authorization")!
          }),
          // Add a custom header to identify this as coming from Next.js API
          "X-Forwarded-By": "nextjs-api-route"
        },
        body: JSON.stringify({ message }),
      }
    );

    console.log(`Backend response status: ${backendResponse.status}`);
    
    // Check if response is OK
    if (!backendResponse.ok) {
      // Try to parse the error response
      let errorData;
      const responseText = await backendResponse.text();
      
      console.error(`Backend error ${backendResponse.status}:`, responseText.substring(0, 200));
      
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // If not JSON, use the raw text
        errorData = { 
          error: `Backend returned ${backendResponse.status}`,
          rawResponse: responseText.substring(0, 500)
        };
      }
      
      // Special handling for 404 - session not found
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { 
            error: "Session not found",
            message: "The chat session was not found. Please create a new session.",
            sessionId,
            backendError: errorData,
            suggestedAction: "create_new_session"
          },
          { 
            status: 404,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
          }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Backend request failed",
          backendError: errorData,
          statusCode: backendResponse.status,
          sessionId
        },
        { 
          status: backendResponse.status,
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
      data = await backendResponse.json();
      console.log(`Backend response successful:`, {
        responseLength: data.response?.length || 0,
        hasAnalysis: !!data.analysis,
        hasMetadata: !!data.metadata
      });
    } catch (parseError) {
      console.error(`Failed to parse backend response:`, parseError);
      return NextResponse.json(
        { 
          error: "Backend returned invalid JSON",
          statusCode: backendResponse.status,
          sessionId
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

    // Return successful response
    return NextResponse.json(
      { 
        ...data,
        _meta: {
          forwardedFrom: BACKEND_API_URL,
          timestamp: new Date().toISOString(),
          sessionId
        }
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Content-Type": "application/json",
        }
      }
    );
    
  } catch (error) {
    console.error(`Unexpected error in chat API:`, error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error instanceof Error ? error.stack : undefined : undefined
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

// Add OPTIONS method for CORS preflight requests
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

// Optional: Add GET method to retrieve chat history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    const { sessionId } = resolvedParams;
    
    console.log(`Fetching chat history for session: ${sessionId}`);
    
    // Validate sessionId
    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      return NextResponse.json(
        { 
          error: "Invalid session ID",
          message: "Session ID is missing or invalid"
        },
        { status: 400 }
      );
    }
    
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: {
          ...(req.headers.get("Authorization") && { 
            "Authorization": req.headers.get("Authorization")!
          }),
        },
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Failed to fetch history: ${backendResponse.status}`, errorText);
      return NextResponse.json(
        { error: "Failed to fetch chat history" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`Error fetching chat history:`, error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}