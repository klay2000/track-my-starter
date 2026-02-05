import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './FamilyTree.css'

function StarterNode({ data }) {
  const { label, isCurrent, onClick, color } = data

  const circleStyle = color ? {
    background: color.fill,
    borderColor: color.stroke,
  } : {}

  const innerStyle = color ? {
    background: color.stroke,
  } : {}

  return (
    <div
      className={`starter-node ${isCurrent ? 'starter-node-current' : ''}`}
      onClick={onClick}
    >
      <Handle type="target" position={Position.Top} className="node-handle" />
      <div className="starter-node-circle" style={circleStyle}>
        <div className="starter-node-inner" style={innerStyle} />
      </div>
      <div className="starter-node-label">{label}</div>
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  )
}

const nodeTypes = {
  starter: StarterNode,
}

export default function FamilyTree({ tree, currentWords, nodeColors = {} }) {
  const navigate = useNavigate()

  const { nodes, edges } = useMemo(() => {
    if (!tree || !tree.nodes || tree.nodes.length === 0) {
      return { nodes: [], edges: [] }
    }

    // Build a map of all nodes by their word ID
    const nodeMap = new Map()
    tree.nodes.forEach((node) => {
      const id = node.words.join('-')
      nodeMap.set(id, { ...node, id, children: [], parent: null })
    })

    // Process edges to build parent-child relationships
    if (tree.edges && tree.edges.length > 0) {
      tree.edges.forEach((edge) => {
        const parentNode = nodeMap.get(edge.from)
        const childNode = nodeMap.get(edge.to)
        if (parentNode && childNode) {
          parentNode.children.push(childNode)
          childNode.parent = parentNode
        }
      })
    }

    // Find the root (node without a parent)
    let rootNode = null
    for (const node of nodeMap.values()) {
      if (!node.parent) {
        rootNode = node
        break
      }
    }

    if (!rootNode && tree.nodes.length > 0) {
      rootNode = nodeMap.get(tree.nodes[0].words.join('-'))
    }

    if (!rootNode) {
      return { nodes: [], edges: [] }
    }

    // Calculate positions using BFS (vertical layout for direct lineage)
    const flowNodes = []
    const flowEdges = []
    const nodeSpacingY = 100
    const nodeSpacingX = 160

    // BFS to assign positions
    const queue = [{ node: rootNode, depth: 0, index: 0, parentX: 0 }]
    const depthCounts = new Map() // Track nodes at each depth for horizontal spacing

    // First pass: count nodes at each depth
    const countQueue = [{ node: rootNode, depth: 0 }]
    while (countQueue.length > 0) {
      const { node, depth } = countQueue.shift()
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1)
      node.children.forEach((child) => {
        countQueue.push({ node: child, depth: depth + 1 })
      })
    }

    // Second pass: assign positions
    const depthIndices = new Map()
    const processQueue = [{ node: rootNode, depth: 0 }]

    while (processQueue.length > 0) {
      const { node, depth } = processQueue.shift()
      const countAtDepth = depthCounts.get(depth) || 1
      const currentIndex = depthIndices.get(depth) || 0
      depthIndices.set(depth, currentIndex + 1)

      // Center nodes horizontally
      const totalWidth = (countAtDepth - 1) * nodeSpacingX
      const startX = -totalWidth / 2
      const x = startX + currentIndex * nodeSpacingX
      const y = depth * nodeSpacingY

      const isCurrent = node.id === currentWords
      const displayLabel = node.name || node.id.split('-').slice(1, 3).join('-')

      flowNodes.push({
        id: node.id,
        type: 'starter',
        position: { x, y },
        data: {
          label: displayLabel,
          isCurrent,
          color: nodeColors[node.id],
          onClick: () => navigate(`/${node.id}`),
        },
      })

      // Add edges and queue children
      node.children.forEach((child) => {
        flowEdges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          style: { stroke: '#d4a574', strokeWidth: 2 },
          animated: false,
        })
        processQueue.push({ node: child, depth: depth + 1 })
      })
    }

    return { nodes: flowNodes, edges: flowEdges }
  }, [tree, currentWords, navigate, nodeColors])

  const onNodeClick = useCallback((event, node) => {
    if (node.data.onClick) {
      node.data.onClick()
    }
  }, [])

  if (nodes.length === 0) {
    return (
      <div className="family-tree-empty">
        <p>No family tree data available</p>
      </div>
    )
  }

  return (
    <div className="family-tree">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={false}
      >
        <Background color="#e8e0d4" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
