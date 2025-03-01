"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Search } from "lucide-react"

interface SearchFormProps {
  onSearch: (companyName: string, location?: string) => void
  isLoading: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [companyName, setCompanyName] = useState("")
  const [location, setLocation] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (companyName.trim()) {
      onSearch(companyName.trim(), location.trim() || undefined)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research a Company</CardTitle>
        <CardDescription>
          Enter a company name to start the research process. Optionally, you can provide a location for more accurate
          results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-background">
              <Building2 className="ml-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                placeholder="Enter company name (e.g., Microsoft)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="Enter location (e.g., Seattle, WA)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-500 text-white" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Researching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Research Company
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

