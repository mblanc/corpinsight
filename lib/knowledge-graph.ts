import type { GraphData } from "@/types/company"

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

export async function buildKnowledgeGraph(
  companyName: string,
  entities: Entity[],
  relationships: Relationship[],
): Promise<GraphData> {
  // Deduplicate entities by ID
  const uniqueEntities = new Map<string, Entity>()
  for (const entity of entities) {
    if (!uniqueEntities.has(entity.id)) {
      uniqueEntities.set(entity.id, entity)
    }
  }

  // Deduplicate relationships (by source-target-type combination)
  const relationshipKey = (rel: Relationship) => `${rel.source}-${rel.target}-${rel.type}`
  const uniqueRelationships = new Map<string, Relationship>()
  for (const relationship of relationships) {
    const key = relationshipKey(relationship)
    if (!uniqueRelationships.has(key)) {
      uniqueRelationships.set(key, relationship)
    }
  }

  // Convert to GraphData format
  const nodes = Array.from(uniqueEntities.values()).map((entity) => ({
    id: entity.id,
    label: entity.name,
    type: entity.type.toLowerCase(),
    description: entity.description,
  }))

  const edges = Array.from(uniqueRelationships.values()).map((relationship) => ({
    source: relationship.source,
    target: relationship.target,
    label: relationship.type.replace(/_/g, " "),
  }))

  // Ensure the main company is in the graph
  const mainCompanyExists = nodes.some(
    (node) => node.type === "company" && node.label.toLowerCase().includes(companyName.toLowerCase()),
  )

  if (!mainCompanyExists) {
    nodes.push({
      id: "company-main",
      label: companyName,
      type: "company",
      description: `Main company: ${companyName}`,
    })
  }

  return { nodes, edges }
}

