import React from 'react'
import { Line, Group, Rect, Circle } from 'react-konva'
import { WallLine } from '../../../../myfloorplan-shared/src/types/architecture'
import { DrawTool, SelectedElement } from '../../types'
import { useEditorStore } from '../../../store/useEditorStore'

import Door2D from './Door2D'
import Window2D from './Window2D'

interface Wall2DProps {
  wall: WallLine
  isSelected: boolean
  activeTool: DrawTool
  selectedElement: SelectedElement | null
}

const Wall2D: React.FC<Wall2DProps> = ({ wall, isSelected, activeTool, selectedElement }) => {
  const updateWallLine = useEditorStore((state) => state.updateWallLine)

  // Pair up the 1D points array into 2D points for easier mapping
  const points2D = []
  for (let i = 0; i < wall.points.length; i += 2) {
    points2D.push({ x: wall.points[i], y: wall.points[i+1], index: i })
  }

  const handleDragPoint = (e: any, index: number) => {
    const newPoints = [...wall.points]
    newPoints[index] = e.target.x()
    newPoints[index + 1] = e.target.y()
    updateWallLine(wall.id, { points: newPoints })
  }

  const handleRemovePoint = (index: number) => {
    if (wall.points.length <= 4) return // Don't remove if it's just a single segment
    const newPoints = [...wall.points]
    newPoints.splice(index, 2)
    updateWallLine(wall.id, { points: newPoints })
  }

  const handleTransformEnd = (e: any) => {
    const node = e.target
    const transform = node.getTransform()
    const newPoints = []
    for (let i = 0; i < wall.points.length; i += 2) {
      const p = transform.point({ x: wall.points[i], y: wall.points[i+1] })
      newPoints.push(p.x, p.y)
    }
    node.scaleX(1)
    node.scaleY(1)
    node.rotation(0)
    node.x(0)
    node.y(0)
    updateWallLine(wall.id, { points: newPoints })
  }

  const handleDragEnd = (e: any) => {
    const node = e.target
    const dx = node.x()
    const dy = node.y()
    const newPoints = []
    for (let i = 0; i < wall.points.length; i += 2) {
      newPoints.push(wall.points[i] + dx, wall.points[i+1] + dy)
    }
    node.x(0)
    node.y(0)
    updateWallLine(wall.id, { points: newPoints })
  }

  const handleLineDblClick = (e: any) => {
    if (!isSelected || activeTool !== 'Select') return
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // Transform pointer to world coordinates (assuming stage is panning/zooming)
    const scale = stage.scaleX()
    const worldX = (pointer.x - stage.x()) / scale
    const worldY = (pointer.y - stage.y()) / scale

    // Find the closest segment to insert the point
    let minDistance = Infinity
    let insertIndex = -1

    for (let i = 0; i < wall.points.length - 2; i += 2) {
      const x1 = wall.points[i], y1 = wall.points[i+1]
      const x2 = wall.points[i+2], y2 = wall.points[i+3]
      const dx = x2 - x1, dy = y2 - y1
      const lenSq = dx*dx + dy*dy
      
      let t = ((worldX - x1) * dx + (worldY - y1) * dy) / lenSq
      t = Math.max(0, Math.min(1, t))
      
      const closestX = x1 + t * dx
      const closestY = y1 + t * dy
      const dist = Math.sqrt(Math.pow(worldX - closestX, 2) + Math.pow(worldY - closestY, 2))
      
      if (dist < minDistance) {
        minDistance = dist
        insertIndex = i + 2
      }
    }

    if (insertIndex !== -1) {
      const newPoints = [...wall.points]
      newPoints.splice(insertIndex, 0, worldX, worldY)
      updateWallLine(wall.id, { points: newPoints })
    }
  }

  return (
    <Group>
      <Line
        id={`wall-${wall.id}`}
        points={wall.points}
        stroke={isSelected ? '#EF4444' : '#334155'}
        strokeWidth={isSelected ? (wall.thickness || 12) + 2 : (wall.thickness || 12)}
        lineCap="round"
        lineJoin="round"
        name="wall"
        onMouseEnter={(e) => {
          if (activeTool === 'Select') {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'pointer'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTool === 'Select') {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
          }
        }}
        onDblClick={handleLineDblClick}
      />
      
      {/* Draggable Handles (Only visible when wall is selected) */}
      {isSelected && activeTool === 'Select' && points2D.map((pt, i) => (
        <Circle
          key={`handle-${i}`}
          x={pt.x}
          y={pt.y}
          radius={8}
          fill="#FFFFFF"
          stroke="#EF4444"
          strokeWidth={3}
          draggable
          onDragMove={(e) => handleDragPoint(e, pt.index)}
          onDblClick={() => handleRemovePoint(pt.index)}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'move'
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
          }}
        />
      ))}
      
      {/* Render Openings */}
      {wall.openings?.map((opening) => {
        const [x1, y1, x2, y2] = wall.points
        const isOpeningSelected = selectedElement?.id === `opening-${opening.id}`
        if (opening.type === 'Window') {
          return <Window2D key={opening.id} opening={opening} x1={x1} y1={y1} x2={x2} y2={y2} wallThickness={wall.thickness || 12} isSelected={isOpeningSelected} />
        } else {
          return <Door2D key={opening.id} opening={opening} x1={x1} y1={y1} x2={x2} y2={y2} wallThickness={wall.thickness || 12} isSelected={isOpeningSelected} />
        }
      })}
    </Group>
  )
}

export default Wall2D
