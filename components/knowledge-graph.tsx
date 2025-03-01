"use client"

import { useCallback, useEffect } from "react"
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  addEdge,
} from '@xyflow/react'
import "@xyflow/react/dist/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GraphData } from "@/types/company"
import { EntityNode } from "./entity-node"

const nodeTypes = {
  entity: EntityNode,
}

interface KnowledgeGraphProps {
  graphData: GraphData
}

const NODE_TYPES = ["company", "person", "product", "location", "event", "other"]
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"]

export function KnowledgeGraph({ graphData }: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  useEffect(() => {
    const typeGroups = NODE_TYPES.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, Node[]>,
    )

    const initialNodes: Node[] = graphData.nodes.map((node) => {
      const nodeType = node.type.toLowerCase()
      const groupIndex = NODE_TYPES.indexOf(nodeType)
      const color = COLORS[groupIndex] || COLORS[COLORS.length - 1]

      const newNode: Node = {
        id: node.id,
        type: "entity",
        data: { ...node, color },
        position: { x: 0, y: 0 }, // Initial position, will be updated later
      }

      if (typeGroups[nodeType]) {
        typeGroups[nodeType].push(newNode)
      } else {
        typeGroups.other.push(newNode)
      }

      return newNode
    })

    // Position nodes in a circular layout for each group
    const centerX = 400
    const centerY = 300
    const radiusStep = 200
    let currentRadius = radiusStep

    NODE_TYPES.forEach((type, typeIndex) => {
      const groupNodes = typeGroups[type]
      if (groupNodes && groupNodes.length > 0) {
        const angleStep = (2 * Math.PI) / groupNodes.length
        groupNodes.forEach((node, index) => {
          const angle = index * angleStep
          const x = centerX + currentRadius * Math.cos(angle)
          const y = centerY + currentRadius * Math.sin(angle)
          node.position = { x, y }
        })
        currentRadius += radiusStep
      }
    })

    setNodes(initialNodes)

    const initialEdges: Edge[] = graphData.edges.map((edge, index) => ({
      id: `e${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: ConnectionLineType.SmoothStep,
      animated: true,
    }))

    setEdges(initialEdges)
  }, [graphData, setNodes, setEdges])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Knowledge Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "600px" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  )
}

