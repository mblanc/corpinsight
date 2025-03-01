import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResearchProgressProps {
  progress: string[]
}

export function ResearchProgress({ progress }: ResearchProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          {progress.map((step, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm">
                <span className="font-medium">Step {index + 1}:</span> {step}
              </p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

