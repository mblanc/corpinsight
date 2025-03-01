"use client"

import { useState } from "react"
import { SearchForm } from "@/components/search-form"
import { ResearchResults } from "@/components/research-results"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { ResearchProgress } from "@/components/research-progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CompanyData } from "@/types/company"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const { toast } = useToast()

  const handleSearch = async (companyName: string, location?: string) => {
    setIsLoading(true)
    setProgress([])
    setCompanyData(null)

    try {
      // Set up SSE for progress updates
      const eventSource = new EventSource(`/api/research/progress?company=${encodeURIComponent(companyName)}`)

      eventSource.onmessage = (event) => {
        console.log("EVENT")
        const data = JSON.parse(event.data)
        console.log(data)
        if (data.progress) {
          setProgress((prev) => [...prev, data.progress])
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
      }

      // Make the actual research request using GET
      const queryParams = new URLSearchParams({
        companyName: companyName,
      })

      // Only add location to queryParams if it's provided and not an empty string
      if (location && location.trim() !== "") {
        queryParams.append("location", location.trim())
      }

      const response = await fetch(`/api/research?${queryParams.toString()}`, {
        method: "GET",
      })

      console.log("Search done")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Failed to research company: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      console.log(contentType)
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Unexpected response format:", text)
        throw new Error("Server responded with non-JSON content")
      }

      const data = await response.json()
      setCompanyData(data)
      eventSource.close()
    } catch (error) {
      console.error("Error researching company:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to research company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">CorpInsight: Company Research Agent</h1>

      <div className="mb-8">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {isLoading && progress.length > 0 && (
        <div className="mb-8">
          <ResearchProgress progress={progress} />
        </div>
      )}

      {companyData && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <ResearchResults companyData={companyData} />
          </TabsContent>
          <TabsContent value="graph" className="mt-4">
            <KnowledgeGraph graphData={companyData.knowledgeGraph} />
          </TabsContent>
        </Tabs>
      )}

      <Toaster />
    </main>
  )
}

