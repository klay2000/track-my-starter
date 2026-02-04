import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as d3 from 'd3'
import './FamilyTree.css'

export default function FamilyTree({ tree, currentWords }) {
  const { nodes: layoutNodes, links, width, height } = useMemo(() => {
    if (!tree || !tree.nodes || tree.nodes.length === 0) {
      return { nodes: [], links: [], width: 0, height: 0 }
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

    // Fallback: if no root found, use the first node
    if (!rootNode && tree.nodes.length > 0) {
      rootNode = nodeMap.get(tree.nodes[0].words.join('-'))
    }

    if (!rootNode) {
      return { nodes: [], links: [], width: 0, height: 0 }
    }

    // Build d3 hierarchy
    const hierarchy = d3.hierarchy(rootNode)
    const treeLayout = d3.tree().nodeSize([140, 100])
    treeLayout(hierarchy)

    const nodes = hierarchy.descendants()
    const links = hierarchy.links()

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x)
      maxX = Math.max(maxX, n.x)
      minY = Math.min(minY, n.y)
      maxY = Math.max(maxY, n.y)
    })

    const padding = 80
    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    // Normalize positions
    nodes.forEach((n) => {
      n.x = n.x - minX + padding
      n.y = n.y - minY + padding
    })

    return { nodes, links, width: Math.max(width, 300), height: Math.max(height, 200) }
  }, [tree])

  if (!layoutNodes.length) {
    return (
      <div className="family-tree-empty">
        <p>No family tree data available</p>
      </div>
    )
  }

  return (
    <div className="family-tree">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8e0d4" />
            <stop offset="100%" stopColor="#d4a574" />
          </linearGradient>
        </defs>

        {links.map((link, i) => (
          <path
            key={i}
            d={`M${link.source.x},${link.source.y}
                C${link.source.x},${(link.source.y + link.target.y) / 2}
                 ${link.target.x},${(link.source.y + link.target.y) / 2}
                 ${link.target.x},${link.target.y}`}
            fill="none"
            stroke="url(#linkGradient)"
            strokeWidth={2}
            opacity={0.6}
          />
        ))}

        {layoutNodes.map((node) => {
          const isCurrent = node.data.id === currentWords
          const displayLabel = node.data.name || node.data.id.split('-').slice(1, 3).join('-')

          return (
            <g key={node.data.id} transform={`translate(${node.x},${node.y})`}>
              <Link to={`/${node.data.id}`}>
                <circle
                  r={isCurrent ? 12 : 10}
                  fill={isCurrent ? '#d4a574' : '#f8f4ed'}
                  stroke={isCurrent ? '#b07d4f' : '#d4a574'}
                  strokeWidth={isCurrent ? 3 : 2}
                  className="tree-node"
                />
                {isCurrent && (
                  <circle
                    r={6}
                    fill="#b07d4f"
                  />
                )}
                <text
                  y={28}
                  textAnchor="middle"
                  className="tree-label"
                >
                  {displayLabel}
                </text>
              </Link>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
