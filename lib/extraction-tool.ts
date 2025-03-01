import { generateText } from "ai"
import { createVertex } from '@ai-sdk/google-vertex';
import type { SearchResult } from "@/types/search"

const vertex = createVertex({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

const MODEL_ID = "gemini-2.0-flash-001"

interface Entity {
  id: string
  name: string
  type: string
  description?: string
  url?: string
  properties?: Record<string, any>
}

interface Relationship {
  source: string
  target: string
  type: string
  properties?: Record<string, any>
}

interface ExtractionResult {
  entities: Entity[]
  relationships: Relationship[]
}

export async function extractInformation(
  searchResults: SearchResult[],
  companyName: string,
): Promise<ExtractionResult> {
  // Prepare the search results for the prompt
  //   const formattedResults = searchResults
  //     .map((result, index) => {
  //       return `Result ${index + 1}:
  // URL: ${result.url}
  // Title: ${result.title}
  // Snippet: ${result.snippet}`
  //     })
  //     .join("\n\n")

  const formattedResults = searchResults.map(result => result.text).join("\n\n")


  try {
    // Use the LLM to extract entities and relationships
    const { text } = await generateText({
      model: vertex(MODEL_ID),
      prompt: `
        Extract structured information about the company "${companyName}" from the following search results:
        
        ${formattedResults}
        
        Your task is to identify and extract:
        
        1. Entities (with unique IDs):
           - Company: The main company and any subsidiaries or parent companies
           - Person: Key executives, founders, or other important people
           - Product: Products or services offered by the company
           - Location: Headquarters, offices, or other important locations
           - Event: Important events in the company's history
           - Other: Any other relevant entities
        
        2. Relationships between entities:
           - employs: Company employs Person
           - subsidiary_of: Company is a subsidiary of another Company
           - founded_by: Company was founded by Person
           - offers: Company offers Product
           - located_in: Company is located in Location
           - competitor_of: Company is a competitor of another Company
           - other relevant relationships
        
        Format your response as a JSON object with the following structure:
        {
          "entities": [
            {
              "id": "unique_id",
              "name": "Entity name",
              "type": "Entity type (Company, Person, Product, Location, Event, Other)",
              "description": "Brief description",
              "url": "URL if available",
              "properties": { additional properties if any }
            },
            ...
          ],
          "relationships": [
            {
              "source": "source_entity_id",
              "target": "target_entity_id",
              "type": "Relationship type",
              "properties": { additional properties if any }
            },
            ...
          ]
        }
        
        Ensure that:
        1. Each entity has a unique ID (e.g., "company-1", "person-2")
        2. Relationships reference entities by their IDs
        3. You only extract information that is supported by the search results
        4. You deduplicate entities and relationships
      `,
    })

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      const extractionResult = JSON.parse(cleanedText) as ExtractionResult
      return extractionResult
    } catch (parseError) {
      console.error("Error parsing extraction result:", parseError)
      console.log("Raw text that failed to parse:", text)

      // Create a minimal valid result with some information from the search results
      const fallbackEntities: Entity[] = [
        {
          id: "company-main",
          name: companyName,
          type: "Company",
          description: "Main company being researched",
        },
      ]

      // Try to extract some basic information from search results
      // searchResults.forEach((result, index) => {
      //   if (result.title.includes(companyName)) {
      //     fallbackEntities.push({
      //       id: `source-${index}`,
      //       name: result.title,
      //       type: "Other",
      //       description: result.snippet,
      //       url: result.url,
      //     })
      //   }
      // })

      return {
        entities: fallbackEntities,
        relationships: [],
      }
    }
  } catch (error) {
    console.error("Error in extraction process:", error)
    // Return minimal valid result
    return {
      entities: [
        {
          id: "company-main",
          name: companyName,
          type: "Company",
          description: "Main company being researched",
        },
      ],
      relationships: [],
    }
  }
}

