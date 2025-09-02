import { NextRequest, NextResponse } from "next/server";

// This function will handle all requests to /api/1inch/*
async function handler(req: NextRequest) {
  const oneInchApiKey = process.env.ONEINCH_API_KEY;

  if (!oneInchApiKey) {
    return NextResponse.json({ error: "ONEINCH_API_KEY is not set in environment variables." }, { status: 500 });
  }

  // Reconstruct the path from the URL, removing the /api/1inch prefix
  const path = req.nextUrl.pathname.replace(/^\/api\/1inch/, "");
  const targetUrl = `https://api.1inch.dev${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${oneInchApiKey}`);
  // The host header must be updated to the target host
  headers.set("host", "api.1inch.dev");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.body,
      // @ts-ignore
      duplex: "half", // Required for streaming request bodies
    });

    // Return the response from the 1inch API directly to the client
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("1inch proxy error:", error);
    return NextResponse.json({ error: "An error occurred while proxying the request." }, { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
