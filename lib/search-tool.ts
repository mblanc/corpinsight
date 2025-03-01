import { generateText } from "ai"
import { createVertex } from '@ai-sdk/google-vertex';


const vertex = createVertex({
  project: 'my-first-project-199607', // optional
  location: 'us-central1', // optional
});

const MODEL_ID = "gemini-2.0-flash-001"

interface SearchResult {
  url: string
  title: string
  snippet: string
}

export async function searchCompany(query: string): Promise<SearchResult[]> {
  console.log(`[Search] Searching for: ${query}`)

  try {
    const { text } = await generateText({
      model: vertex(MODEL_ID),
      prompt: `
        Generate 3-5 realistic search results for the following query: "${query}"
        
        Each result should include:
        1. A plausible URL
        2. A relevant title
        3. A brief snippet or description

        Format the response as a JSON array of objects, each with "url", "title", and "snippet" properties.
        
        Example format:
        [
          {
            "url": "https://www.example.com/about",
            "title": "About Example Company - Our Mission and Values",
            "snippet": "Learn about Example Company's history, mission, and core values. Discover how we're revolutionizing the industry since our founding in 2005."
          },
          ...
        ]
      `,
    })

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      const searchResults: SearchResult[] = JSON.parse(cleanedText)
      return searchResults
    } catch (parseError) {
      console.error("Error parsing search results:", parseError)
      console.log("Raw text that failed to parse:", text)
      throw new Error("Failed to parse search results")
    }
  } catch (error) {
    console.error("Error generating search results:", error)
    throw new Error("Failed to generate search results")
  }
}

