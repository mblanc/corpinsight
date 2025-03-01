export interface EntityItem {
  id?: string
  name: string
  description?: string
  url?: string
  type?: string
}

export interface Source {
  uri: string
  title: string
}

export interface GraphNode {
  id: string
  label: string
  type: string
  description?: string
  url?: string
  // Add any other attributes you want to display
}

export interface GraphEdge {
  source: string
  target: string
  label: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface CompanyData {
  companyName: string
  summary: string
  entities: {
    [key: string]: EntityItem[]
  }
  redFlags?: string[]
  sources: Source[]
  searchEntryPoints: string[]
  knowledgeGraph: GraphData
}

