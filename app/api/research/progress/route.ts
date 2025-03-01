import { type NextRequest, NextResponse } from "next/server"
import { progressStore } from "@/lib/progress-store"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const company = searchParams.get("company")

  if (!company) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 })
  }

  const sessionId = company.toLowerCase().replace(/\s+/g, "-")

  // Set up Server-Sent Events
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Function to send progress updates
      const sendProgress = (progress: string) => {
        const data = encoder.encode(`data: ${JSON.stringify({ progress })}\n\n`)
        controller.enqueue(data)
      }

      // Register the callback for this session
      progressStore.subscribe(sessionId, sendProgress)

      // Send any existing progress
      const existingProgress = progressStore.getProgress(sessionId)
      for (const progress of existingProgress) {
        sendProgress(progress)
      }

      // Keep the connection alive with a ping every 15 seconds
      const pingInterval = setInterval(() => {
        const data = encoder.encode(`: ping\n\n`)
        controller.enqueue(data)
      }, 15000)

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval)
        progressStore.unsubscribe(sessionId, sendProgress)
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

