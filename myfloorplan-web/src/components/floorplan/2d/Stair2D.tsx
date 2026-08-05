import React from 'react'
import { Group, Rect, Line } from 'react-konva'
import { StructuralElement } from '../../../../myfloorplan-shared/src/types/architecture'
import { useEditorStore } from '../../../store/useEditorStore'

interface Stair2DProps {
  stair: StructuralElement
  isSelected: boolean
}

const Stair2D: React.FC<Stair2DProps> = ({ stair, isSelected }) => {
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem) // Using placed items mechanism temporarily
  
  const stepCount = stair.stepCount || 10
  const w = stair.dimensions.width
  const h = stair.dimensions.height // treating height as depth for 2D footprint

  const steps = []
  const stepDepth = h / stepCount

  for (let i = 0; i < stepCount; i++) {
    steps.push(
      <Line
        key={`step-${i}`}
        points={[-w/2, -h/2 + i * stepDepth, w/2, -h/2 + i * stepDepth]}
        stroke="#94A3B8"
        strokeWidth={1}
      />
    )
  }

  // Handle Drag
  const handleDragEnd = (e: any) => {
    // If managed by placed items
    updatePlacedItem(stair.id, {
      position: { x: e.target.x(), y: 0, z: e.target.y() }
    })
  }

  const handleTransformEnd = (e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    
    updatePlacedItem(stair.id, {
      position: { x: node.x(), y: 0, z: node.y() },
      rotation: node.rotation(),
      scale: {
        x: (stair.scale?.x || 1) * scaleX,
        y: (stair.scale?.y || 1) * scaleY,
        z: stair.scale?.z || 1
      }
    })
  }

  return (
    <Group
      id={stair.id}
      name="furniture-icon"
      x={stair.position.x}
      y={stair.position.z}
      scaleX={Math.max(0.01, stair.scale?.x ?? 1)}
      scaleY={Math.max(0.01, stair.scale?.y ?? 1)}
      rotation={stair.rotation}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      <Rect
        x={-w/2}
        y={-h/2}
        width={w}
        height={h}
        fill="transparent"
        stroke={isSelected ? '#4F46E5' : '#64748B'}
        strokeWidth={isSelected ? 2 : 1}
      />
      {steps}
      {/* Direction Arrow */}
      <Line 
        points={[0, h/2 - 10, 0, -h/2 + 10, -5, -h/2 + 15, 0, -h/2 + 10, 5, -h/2 + 15]}
        stroke="#64748B"
        strokeWidth={1}
      />
    </Group>
  )
}

export default Stair2D
