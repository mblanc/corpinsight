import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { researchCompany } from "@/lib/research-agent"
import { progressStore } from "@/lib/progress-store"

export async function GET(req: NextRequest) {
  console.log("Search request")
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const companyName = searchParams.get("companyName")
    const location = searchParams.get("location")

    // Validate input
    const schema = z.object({
      companyName: z.string().min(1),
      location: z.string().nullish(), // Change this line
    })

    try {
      schema.parse({ companyName, location })
    } catch (error) {
      console.error("Validation error:", error)
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
    }

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    // Generate a unique ID for this research session
    const sessionId = companyName.toLowerCase().replace(/\s+/g, "-")

    // Initialize progress tracking
    progressStore.initSession(sessionId)

    try {
      // Start the research process
      const companyData = await researchCompany(companyName, location || undefined, sessionId)

      console.log(companyData)
      // Clean up progress tracking
      progressStore.clearSession(sessionId)

      // Ensure we're returning a valid JSON object
      return NextResponse.json(companyData)
    } catch (error) {
      console.error("Error in research process:", error)
      progressStore.clearSession(sessionId)
      return NextResponse.json(
        {
          error: "Research process failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in research API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

