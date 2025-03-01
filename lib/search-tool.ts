import { generateText } from "ai"
import { createVertex } from '@ai-sdk/google-vertex';
import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import type { SearchResult } from "@/types/search"


const vertex = createVertex({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

const MODEL_ID = "gemini-2.0-flash-001"

export async function searchCompany(query: string): Promise<SearchResult> {
  console.log(`[Search] Searching for: ${query}`)

  try {
    const { text, providerMetadata } = await generateText({
      model: vertex(MODEL_ID, {
        useSearchGrounding: true,
      }),
      prompt: query,
    })

    const metadata = providerMetadata?.google as
      | GoogleGenerativeAIProviderMetadata
      | undefined;
    const groundingMetadata = metadata?.groundingMetadata;
    console.log("GROUNDING METADATA")
    console.log(JSON.stringify(groundingMetadata?.groundingChunks))


    const searchEntryPoint = groundingMetadata?.searchEntryPoint?.renderedContent ?? ""


    const chunks: {uri: string, title: string}[] = groundingMetadata?.groundingChunks?.map((chunk) => ({
      uri: chunk.web?.uri ?? "",
      title: chunk.web?.title ?? "",
    })) ?? []

    try {
      const cleanedText = text.replace(/```json\s?|```/g, "").trim()
      // const searchResults: SearchResult[] = JSON.parse(cleanedText)
      return {text: cleanedText, chunks: chunks, searchEntryPoint: searchEntryPoint}
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

