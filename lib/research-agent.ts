import { generateText } from "ai"
import { createVertex } from '@ai-sdk/google-vertex';
import type { CompanyData, GraphData } from "@/types/company"
import { progressStore } from "@/lib/progress-store"
import { searchCompany } from "@/lib/search-tool"
import { extractInformation } from "@/lib/extraction-tool"
import { buildKnowledgeGraph } from "@/lib/knowledge-graph"
import type { SearchResult } from "@/types/search"


const vertex = createVertex({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

const MODEL_ID = "gemini-2.0-flash-001"

export async function researchCompany(
  companyName: string,
  location?: string,
  sessionId?: string,
): Promise<CompanyData> {
  const updateProgress = (message: string) => {
    if (sessionId) {
      progressStore.addProgress(sessionId, message)
    }
    console.log(`[Research] ${message}`)
  }

  let summary = ""
  let redFlags: string[] = []
  let structuredEntities: { [key: string]: any[] } = {}
  let sources: {
    uri: string,
    title: string,
  }[] = []
  let searchEntryPoints: string[] = []
  let knowledgeGraph: GraphData = { nodes: [], edges: [] }

  try {
    updateProgress("Generating initial search queries...")
    const initialQueries = await generateInitialQueries(companyName, location)

    updateProgress("Performing initial searches...")
    let initialResults: SearchResult[] = []
    try {
      initialResults = (await Promise.all(initialQueries.map((query) => searchCompany(query)))).flat()
    } catch (searchError) {
      console.error("Error in initial search:", searchError)
      updateProgress("Encountered an error during initial search. Proceeding with limited information.")
    }

    updateProgress("Extracting key information from search results...")
    const initialExtraction = await extractInformation(initialResults.flat(), companyName)

    updateProgress("Generating follow-up queries based on initial findings...")
    const followUpQueries = await generateFollowUpQueries(companyName, initialExtraction)

    updateProgress("Performing follow-up searches...")
    let followUpResults: SearchResult[] = []
    try {
      followUpResults = (await Promise.all(followUpQueries.map((query) => searchCompany(query)))).flat()
    } catch (searchError) {
      console.error("Error in follow-up search:", searchError)
      updateProgress("Encountered an error during follow-up search. Proceeding with available information.")
    }

    updateProgress("Extracting additional information...")
    const additionalExtraction = await extractInformation(followUpResults.flat(), companyName)

    updateProgress("Building knowledge graph...")
    knowledgeGraph = await buildKnowledgeGraph(
      companyName,
      [...initialExtraction.entities, ...additionalExtraction.entities],
      [...initialExtraction.relationships, ...additionalExtraction.relationships],
    )

    updateProgress("Generating summary and identifying potential red flags...")
    const summaryResult = await generateSummary(
      companyName,
      knowledgeGraph,
      [...initialExtraction.entities, ...additionalExtraction.entities],
      [...initialResults, ...followUpResults].flat(),
    )
    summary = summaryResult.summary
    redFlags = summaryResult.redFlags
    structuredEntities = summaryResult.structuredEntities

    sources = [...initialResults, ...followUpResults].flat().flatMap((result) => result.chunks)
    searchEntryPoints = [...initialResults, ...followUpResults].flat().flatMap((result) => result.searchEntryPoint)
  } catch (error) {
    console.error("Error in research process:", error)
    summary = `An error occurred while researching ${companyName}. Some information may be incomplete.`
    redFlags.push("Research process encountered errors")
  }

  // Ensure we always return a valid CompanyData object
  return {
    companyName,
    summary,
    entities: structuredEntities,
    redFlags,
    sources,
    searchEntryPoints,
    knowledgeGraph,
  }
}

async function generateInitialQueries(companyName: string, location?: string): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: vertex(MODEL_ID),
      prompt: `
        Generate 3-5 search queries to gather comprehensive information about the company "${companyName}"${
          location ? ` located in ${location}` : ""
        }.

        The date is ${new Date()}
        
        The queries should help find information about:
        1. The company's official website and social media profiles
        2. Basic company information (founding date, headquarters, industry)
        3. Key executives and leadership team
        4. Products or services offered
        5. Recent news or developments
        
        Format the response as a JSON array of strings, each representing a search query.
      `,
    })

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      return JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Error parsing initial queries:", parseError)
      console.log("Raw text that failed to parse:", text)

      // Fallback queries if parsing fails
      return [
        `${companyName} official website`,
        `${companyName} company information`,
        `${companyName} executives leadership`,
        `${companyName} products services`,
        `${companyName} recent news`,
      ]
    }
  } catch (error) {
    console.error("Error generating initial queries:", error)
    // Fallback if the API call fails
    return [
      `${companyName} official website`,
      `${companyName} company information`,
      `${companyName} executives leadership`,
    ]
  }
}

async function generateFollowUpQueries(companyName: string, initialExtraction: any): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: vertex(MODEL_ID),
      prompt: `
        Based on the initial information gathered about "${companyName}", generate 3-5 follow-up search queries to fill in gaps or explore specific aspects in more detail.
        
        Initial information:
        ${JSON.stringify(initialExtraction, null, 2)}
        
        Consider generating queries about:
        1. Subsidiaries or parent companies
        2. Specific products or services that were mentioned
        3. Key executives and their backgrounds
        4. Company history or major milestones
        5. Competitors or industry position
        
        Format the response as a JSON array of strings, each representing a search query.
      `,
    })

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      return JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Error parsing follow-up queries:", parseError)
      console.log("Raw text that failed to parse:", text)

      // Fallback queries if parsing fails
      return [
        `${companyName} subsidiaries parent company`,
        `${companyName} history milestones`,
        `${companyName} CEO background`,
        `${companyName} competitors market position`,
        `${companyName} financial information`,
      ]
    }
  } catch (error) {
    console.error("Error generating follow-up queries:", error)
    // Fallback if the API call fails
    return [
      `${companyName} subsidiaries parent company`,
      `${companyName} history milestones`,
      `${companyName} competitors market position`,
    ]
  }
}

async function generateSummary(
  companyName: string,
  knowledgeGraph: GraphData,
  entities: any[],
  searchResults: any[],
): Promise<{
  summary: string
  redFlags: string[]
  structuredEntities: { [key: string]: any[] }
}> {
  try {
    const { text } = await generateText({
      model: vertex(MODEL_ID),
      prompt: `
        Generate a comprehensive summary of "${companyName}" based on the knowledge graph and extracted information.
        
        Knowledge Graph:
        ${JSON.stringify(knowledgeGraph, null, 2)}
        
        Extracted Entities:
        ${JSON.stringify(entities, null, 2)}
        
        Your task:
        1. Write a detailed summary (300-500 words) about the company, including its history, business model, products/services, leadership, and market position.
        2. Identify any potential red flags or inconsistencies in the information (e.g., company doesn't exist anymore, conflicting information, suspicious patterns).
        3. Organize the entities into categories (e.g., executives, products, subsidiaries, locations).
        
        Format your response as a JSON object with the following structure:
        {
          "summary": "Detailed text summary...",
          "redFlags": ["Red flag 1", "Red flag 2", ...],
          "structuredEntities": {
            "executives": [
              { "name": "Name", "description": "Role and background", "url": "Optional URL" },
              ...
            ],
            "products": [...],
            "subsidiaries": [...],
            ...
          }
        }
      `,
    })

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      return JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Error parsing summary JSON:", parseError)
      console.log("Raw text that failed to parse:", text)

      // Return a structured fallback response
      return {
        summary: `Information about ${companyName} has been gathered, but could not be properly formatted. Here's what we found: ${text.substring(0, 500)}...`,
        redFlags: ["Summary generation failed - formatting error"],
        structuredEntities: {
          information: [
            {
              name: "Raw Data",
              description: "The research was completed but the results couldn't be properly structured.",
            },
          ],
        },
      }
    }
  } catch (error) {
    console.error("Error generating summary:", error)
    // Return a basic structure if generation fails
    return {
      summary: `We encountered an error while researching ${companyName}. Please try again later.`,
      redFlags: ["Summary generation failed - API error"],
      structuredEntities: {},
    }
  }
}

