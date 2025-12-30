import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      return NextResponse.json(
        {
          error: "Invalid session ID",
          message: "Please create a chat session first",
          receivedSessionId: sessionId,
        },
        { status: 400 }
      );
    }

    console.log(`Fetching history for session: ${sessionId}`);

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error ${response.status}:`, errorText);

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Session not found",
            message:
              "The chat session was not found. Please create a new session.",
            sessionId,
          },
          { status: 404 }
        );
      }

      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat history API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chat history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId || sessionId === "undefined" || sessionId === "null") {
      console.error(`Invalid sessionId received: "${sessionId}"`);

      return NextResponse.json(
        {
          error: "Invalid session ID",
          message:
            "Chat session is not available. Please create a session first.",
          solution: "Call POST /api/sessions to create a new chat session",
          receivedSessionId: sessionId,
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`Processing message for session: ${sessionId}`);

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "Message is required",
          message: "Please provide a message to send",
          receivedBody: body,
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(
      `Sending message to session ${sessionId}: "${message.substring(0, 50)}${
        message.length > 50 ? "..." : ""
      }"`
    );

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          ...(req.headers.get("Authorization") && {
            Authorization: req.headers.get("Authorization")!,
          }),
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error ${response.status}:`, errorText);

      try {
        const errorData = JSON.parse(errorText);

        if (response.status === 404) {
          return NextResponse.json(
            {
              error: "Session not found",
              message: "The chat session was not found on the backend server.",
              sessionId,
              backendError: errorData,
              suggestedAction: "create_new_session",
            },
            {
              status: 404,
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        return NextResponse.json(
          {
            error: "Backend request failed",
            backendError: errorData,
            statusCode: response.status,
            sessionId,
          },
          {
            status: response.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (parseError) {
        return NextResponse.json(
          {
            error: "Backend server error",
            rawResponse: errorText.substring(0, 500),
            statusCode: response.status,
            sessionId,
          },
          {
            status: response.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    const data = await response.json();

    const enhancedData = {
      ...data,
      _meta: {
        sessionId,
        backendUrl: BACKEND_API_URL,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(enhancedData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "Please send valid JSON in the request body",
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}
