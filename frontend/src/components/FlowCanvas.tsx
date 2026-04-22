import { useMemo } from 'react'
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import { CompanyInput } from '../lib/types'

interface Props {
  company: CompanyInput
}

export function FlowCanvas({ company }: Props) {
  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []

    ns.push({
      id: 'ceo',
      position: { x: 400, y: 20 },
      data: { label: `${company.name || 'Company'}\nCEO` },
      className: 'dept-ceo',
      type: 'default',
    })

    const spacing = 220
    const startX = 400 - ((company.departments.length - 1) * spacing) / 2
    company.departments.forEach((d, i) => {
      const nodeId = `dept-${d.id}`
      ns.push({
        id: nodeId,
        position: { x: startX + i * spacing, y: 150 },
        data: { label: d.name },
        className: `dept-${d.type}`,
        type: 'default',
      })
      es.push({
        id: `e-ceo-${nodeId}`,
        source: 'ceo',
        target: nodeId,
        animated: false,
      })
      d.roles.forEach((role, j) => {
        const roleId = `${nodeId}-r-${j}`
        ns.push({
          id: roleId,
          position: { x: startX + i * spacing - 60 + (j % 2) * 120, y: 280 + Math.floor(j / 2) * 80 },
          data: { label: role },
          type: 'default',
        })
        es.push({
          id: `e-${nodeId}-${roleId}`,
          source: nodeId,
          target: roleId,
        })
      })
    })

    return { nodes: ns, edges: es }
  }, [company])

  return (
    <div className="canvas" style={{ width: '100%', height: '100%' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }} proOptions={{ hideAttribution: true }}>
        <Background gap={24} size={1} color="#2a3566" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
