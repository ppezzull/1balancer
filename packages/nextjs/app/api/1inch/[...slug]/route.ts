import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This function will handle all requests to /api/1inch/*
async function handler(req: NextRequest) {
  const oneInchApiKey = process.env.ONEINCH_API_KEY;

  if (!oneInchApiKey) {
    return NextResponse.json({ error: "ONEINCH_API_KEY is not set in environment variables." }, { status: 500 });
  }

  // Reconstruct the path from the URL, removing the /api/1inch prefix
  const path = req.nextUrl.pathname.replace(/^\/api\/1inch/, "");
  const targetUrl = `https://api.1inch.dev${path}${req.nextUrl.search}`;

  // Debug logging
  console.log("1inch proxy request:", {
    path,
    targetUrl,
    method: req.method,
    hasApiKey: !!oneInchApiKey,
    apiKeyStart: oneInchApiKey.substring(0, 3) + "...",
    search: req.nextUrl.search,
  });

  // Build headers for upstream fetch
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${oneInchApiKey}`);
  headers.set("x-api-key", oneInchApiKey);
  headers.set("Accept", "application/json");

  // forward content-type if present
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  try {
    console.log("Fetching from 1inch:", targetUrl);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      // NextRequest.body is a ReadableStream; pass it through for non-GET requests
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      // @ts-ignore
      duplex: "half",
      cache: "no-store",
    });

    // If upstream errored, buffer the text for better diagnostics
    if (!response.ok) {
      const errorText = await response.text();
      console.error("1inch proxy upstream error:", {
        url: targetUrl,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Return formatted error details for easier debugging
      return NextResponse.json(
        {
          error: "Upstream API error",
          status: response.status,
          statusText: response.statusText,
          details: errorText,
          url: targetUrl,
        },
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Return the response from the 1inch API directly to the client
    const resHeaders = new Headers(response.headers);
    // remove hop-by-hop or encoding headers that can break the browser
    // (node fetch may have already decompressed the body but upstream headers
    // still declare a content-encoding, which causes ERR_CONTENT_DECODING_FAILED)
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("content-encoding");
    // Remove content-length because the body stream may have changed length
    resHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("1inch proxy error:", error);
    return NextResponse.json(
      {
        error: "An error occurred while proxying the request.",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 },
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
