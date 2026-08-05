import React from 'react'
import { Group, Rect, Arc, Line } from 'react-konva'
import { WallOpening } from '../../../../myfloorplan-shared/src/types/architecture'

interface Door2DProps {
  opening: WallOpening
  x1: number
  y1: number
  x2: number
  y2: number
  wallThickness: number
  isSelected?: boolean
}

const Door2D: React.FC<Door2DProps> = ({ opening, x1, y1, x2, y2, wallThickness, isSelected }) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const posX = x1 + dx * opening.offset
  const posY = y1 + dy * opening.offset
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const openingWidth = opening.dimensions?.width || 80
  
  // Style could dictate double door, sliding, etc.
  const isDouble = opening.styleId === 'double-door'
  const isSliding = opening.styleId === 'sliding-glass'

  return (
    <Group 
      x={posX} y={posY} rotation={angle}
      name="opening"
      id={`opening-${opening.id}`}
    >
      {isSelected && (
        <Rect
          x={-openingWidth / 2 - 5}
          y={-wallThickness / 2 - 5}
          width={openingWidth + 10}
          height={wallThickness + 10}
          fill="rgba(99, 102, 241, 0.3)"
          cornerRadius={4}
        />
      )}
      {/* Cutout (hide wall) */}
      <Rect
        x={-openingWidth / 2}
        y={-wallThickness / 2}
        width={openingWidth}
        height={wallThickness}
        fill="#F8FAFC" // Matches background, essentially masking the wall
      />

      {isSliding ? (
        <Group>
          <Rect x={-openingWidth/2} y={-4} width={openingWidth/2 + 5} height={4} fill="#94A3B8" />
          <Rect x={-5} y={0} width={openingWidth/2 + 5} height={4} fill="#94A3B8" />
        </Group>
      ) : isDouble ? (
        <Group>
          {/* Left Door */}
          <Arc x={-openingWidth/2} y={-wallThickness/2} innerRadius={openingWidth/2} outerRadius={openingWidth/2} angle={90} rotation={270} stroke="#94A3B8" strokeWidth={1} dash={[4,4]} />
          <Line points={[-openingWidth/2, -wallThickness/2, -openingWidth/2, -wallThickness/2 - openingWidth/2]} stroke="#1E293B" strokeWidth={3} />
          {/* Right Door */}
          <Arc x={openingWidth/2} y={-wallThickness/2} innerRadius={openingWidth/2} outerRadius={openingWidth/2} angle={90} rotation={180} stroke="#94A3B8" strokeWidth={1} dash={[4,4]} />
          <Line points={[openingWidth/2, -wallThickness/2, openingWidth/2, -wallThickness/2 - openingWidth/2]} stroke="#1E293B" strokeWidth={3} />
        </Group>
      ) : (
        <Group>
          {/* Single Swing Door */}
          <Arc 
            x={-openingWidth/2} 
            y={-wallThickness/2} 
            innerRadius={openingWidth} 
            outerRadius={openingWidth} 
            angle={90} 
            rotation={270} 
            stroke="#94A3B8" 
            strokeWidth={1} 
            dash={[4,4]} 
          />
          <Line 
            points={[-openingWidth/2, -wallThickness/2, -openingWidth/2, -wallThickness/2 - openingWidth]} 
            stroke="#1E293B" 
            strokeWidth={3} 
          />
        </Group>
      )}
    </Group>
  )
}

export default Door2D
