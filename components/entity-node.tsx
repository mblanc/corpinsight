import { memo } from "react"
import { Handle, Position } from '@xyflow/react'

export const EntityNode = memo(({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2" style={{ borderColor: data.color }}>
      <Handle type="target" position={Position.Top} className="w-16" style={{ background: data.color }} />
      <div className="flex flex-col">
        <div className="flex items-center">
          <div
            className="rounded-full w-12 h-12 flex items-center justify-center text-white"
            style={{ backgroundColor: data.color }}
          >
            {data.type.charAt(0).toUpperCase()}
          </div>
          <div className="ml-2">
            <div className="text-lg font-bold">{data.label}</div>
            <div className="text-gray-500">{data.type}</div>
          </div>
        </div>
        {data.description && (
          <div className="mt-2 text-gray-700">
            <strong>Description:</strong> {data.description}
          </div>
        )}
        {data.url && (
          <div className="mt-1 text-blue-500">
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-16" style={{ background: data.color }} />
    </div>
  )
})

EntityNode.displayName = "EntityNode"

