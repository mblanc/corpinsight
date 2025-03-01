import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompanyData } from "@/types/company"
import { ExternalLink } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ResearchResultsProps {
  companyData: CompanyData
}

export function ResearchResults({ companyData }: ResearchResultsProps) {
  const { summary, entities, redFlags, sources } = companyData

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{summary}</p>

          {redFlags && redFlags.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Potential Red Flags</h3>
              <ul className="list-disc pl-5 space-y-1">
                {redFlags.map((flag, index) => (
                  <li key={index} className="text-red-500">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(entities).map(([category, items], index) => (
              <AccordionItem key={index} value={category}>
                <AccordionTrigger className="text-lg font-medium capitalize">
                  {category.replace(/([A-Z])/g, " $1").trim()}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {items.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline flex items-center mt-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {item.url}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {source.title || source.url}
                </a>
                {source.description && <p className="text-sm text-muted-foreground ml-6">{source.description}</p>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

