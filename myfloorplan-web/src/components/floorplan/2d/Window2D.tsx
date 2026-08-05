import React from 'react'
import { Rect, Group } from 'react-konva'
import { WallOpening } from '../../../../myfloorplan-shared/src/types/architecture'

interface Window2DProps {
  opening: WallOpening
  x1: number
  y1: number
  x2: number
  y2: number
  wallThickness: number
  isSelected?: boolean
}

const Window2D: React.FC<Window2DProps> = ({ opening, x1, y1, x2, y2, wallThickness, isSelected }) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const posX = x1 + dx * opening.offset
  const posY = y1 + dy * opening.offset
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const openingWidth = opening.dimensions?.width || 60
  
  return (
    <Group 
      x={posX} y={posY} rotation={angle}
      name="opening"
      id={`opening-${opening.id}`}
    >
      {isSelected && (
        <Rect
          x={-openingWidth / 2 - 5}
          y={-(wallThickness + 4) / 2 - 5}
          width={openingWidth + 10}
          height={wallThickness + 14}
          fill="rgba(99, 102, 241, 0.3)"
          cornerRadius={4}
        />
      )}
      {/* Sill */}
      <Rect
        x={-openingWidth / 2}
        y={-(wallThickness + 4) / 2}
        width={openingWidth}
        height={wallThickness + 4}
        fill="#F8FAFC"
        stroke="#94A3B8"
        strokeWidth={1}
      />
      {/* Glass Pane */}
      <Rect
        x={-openingWidth / 2}
        y={-2}
        width={openingWidth}
        height={4}
        fill="#BAE6FD"
        opacity={0.8}
      />
    </Group>
  )
}

export default Window2D
