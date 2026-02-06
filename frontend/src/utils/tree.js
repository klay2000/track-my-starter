import { NODE_COLORS } from '../constants/starters'

export function buildNodeColors(nodes) {
  const colors = {}
  nodes.forEach((node, index) => {
    const nodeWords = node.words.join('-')
    colors[nodeWords] = NODE_COLORS[index % NODE_COLORS.length]
  })
  return colors
}
