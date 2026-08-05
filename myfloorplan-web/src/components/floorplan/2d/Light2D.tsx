import React from 'react'
import { Group, Circle, Arc, Rect } from 'react-konva'
import { LightingItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useEditorStore } from '../../../store/useEditorStore'

interface Light2DProps {
  light: LightingItem
  isSelected: boolean
}

const Light2D: React.FC<Light2DProps> = ({ light, isSelected }) => {
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem)

  const handleDragEnd = (e: any) => {
    updatePlacedItem(light.id, {
      position: { x: e.target.x(), y: 0, z: e.target.y() }
    })
  }

  const handleTransformEnd = (e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    
    updatePlacedItem(light.id, {
      position: { x: node.x(), y: 0, z: node.y() },
      rotation: node.rotation(),
      scale: {
        x: (light.scale?.x || 1) * scaleX,
        y: (light.scale?.y || 1) * scaleY,
        z: light.scale?.z || 1
      }
    })
  }

  const color = light.lightColor || '#FDE047'

  return (
    <Group
      id={light.id}
      name="furniture-icon"
      x={light.position.x}
      y={light.position.z}
      scaleX={Math.max(0.01, light.scale?.x ?? 1)}
      scaleY={Math.max(0.01, light.scale?.y ?? 1)}
      rotation={light.rotation}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Glow / Range indicator */}
      {isSelected && light.range && (
        <Circle
          radius={light.range}
          fill={color}
          opacity={0.1}
        />
      )}

      {/* Light Source Icon */}
      <Circle
        radius={12}
        fill={color}
        stroke={isSelected ? '#4F46E5' : '#EAB308'}
        strokeWidth={2}
        shadowColor={color}
        shadowBlur={10}
      />
      {/* Cross symbol commonly used for lights */}
      <Group rotation={45}>
        <Rect x={-8} y={-1} width={16} height={2} fill={isSelected ? '#4F46E5' : '#EAB308'} />
        <Rect x={-1} y={-8} width={2} height={16} fill={isSelected ? '#4F46E5' : '#EAB308'} />
      </Group>

      {/* Spot light indicator */}
      {light.lightType === 'spot' && (
        <Arc
          angle={45}
          rotation={-22.5}
          innerRadius={15}
          outerRadius={30}
          fill={color}
          opacity={0.5}
        />
      )}
    </Group>
  )
}

export default Light2D
