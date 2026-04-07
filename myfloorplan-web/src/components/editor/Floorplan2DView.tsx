import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Text, Image as KonvaImage, Rect, Circle, Group } from 'react-konva'
import { useEditorStore } from '../../store/useEditorStore'
import { WallLine, PlacedItem, DrawTool } from '../../types'
import { v4 as uuidv4 } from 'uuid'
import useImage from 'use-image'
import { 
  Move, 
  Search, 
  Maximize, 
  Ruler as RulerIcon, 
  Plus, 
  Minus,
  MousePointer2,
  Square,
  DoorOpen,
  Layout
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

const FurnitureIcon = ({ item }: { item: PlacedItem }) => {
  const [image] = useImage(item.imageUrl || '')
  return image ? (
    <KonvaImage
      image={image}
      x={item.position.x}
      y={item.position.z}
      width={50}
      height={50}
      offsetX={25}
      offsetY={25}
      rotation={item.rotation}
      draggable
    />
  ) : (
    <Rect
      x={item.position.x}
      y={item.position.z}
      width={40}
      height={40}
      offsetX={20}
      offsetY={20}
      fill="#6366F1"
      cornerRadius={5}
      rotation={item.rotation}
      draggable
      name="furniture-icon"
      id={item.id}
    />
  )
}

const Floorplan2DView: React.FC = () => {
  const { 
    wallLines, addWallLine, 
    addWallOpening,
    rooms, addRoom,
    placedItems, addPlacedItem, 
    selectedLibraryItem, setSelectedLibraryItem,
    selectedElement, setSelectedElement,
    gridSize, activeTool, setActiveTool
  } = useEditorStore(useShallow(state => ({
    wallLines: state.wallLines,
    addWallLine: state.addWallLine,
    addWallOpening: state.addWallOpening,
    rooms: state.rooms,
    addRoom: state.addRoom,
    placedItems: state.placedItems,
    addPlacedItem: state.addPlacedItem,
    selectedLibraryItem: state.selectedLibraryItem,
    setSelectedLibraryItem: state.setSelectedLibraryItem,
    selectedElement: state.selectedElement,
    setSelectedElement: state.setSelectedElement,
    gridSize: state.gridSize,
    activeTool: state.activeTool,
    setActiveTool: state.setActiveTool
  })))
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [currentLine, setCurrentLine] = useState<number[] | null>(null)
  const [currentRoomPoints, setCurrentRoomPoints] = useState<number[]>([])
  const isDrawing = useRef(false)

  // Pan & Zoom State
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  // Ruler State
  const [rulerStart, setRulerStart] = useState<{ x: number, y: number } | null>(null)
  const [rulerEnd, setRulerEnd] = useState<{ x: number, y: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const snapToGrid = (val: number) => Math.round(val / gridSize) * gridSize

  const getPointerPos = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return null
    
    // Transform stage coordinates back to world coordinates
    return {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    }
  }

  const handleMouseDown = (e: any) => {
    // If Pan tool is active or middle click, don't do drawing logic
    if (activeTool === 'Pan' || e.evt.button === 1) return

    const pos = getPointerPos(e)
    if (!pos) return

    const snappedX = snapToGrid(pos.x)
    const snappedY = snapToGrid(pos.y)

    // Ruler Logic
    if (activeTool === 'Ruler') {
      setRulerStart({ x: snappedX, y: snappedY })
      setRulerEnd({ x: snappedX, y: snappedY })
      return
    }

    // 1. TOOL: PLACE ITEM (Furniture)
    if (selectedLibraryItem) {
      const newItem: PlacedItem = {
        id: uuidv4(),
        type: selectedLibraryItem.title,
        category: selectedLibraryItem.category,
        position: { x: snappedX, y: 0, z: snappedY },
        rotation: 0,
        scale: 1,
        imageUrl: selectedLibraryItem.imageUrl,
        modelUrl: selectedLibraryItem.modelUrl
      }
      addPlacedItem(newItem)
      setSelectedLibraryItem(null)
      return
    }

    // 2. TOOL: WINDOW / DOOR (PLACED ON WALL)
    if (activeTool === 'Window' || activeTool === 'Door') {
      const target = e.target
      if (target.className === 'Line' && target.attrs.id?.startsWith('wall-')) {
        const wallId = target.attrs.id.replace('wall-', '')
        const wall = wallLines.find(w => w.id === wallId)
        if (wall) {
          const [x1, y1, x2, y2] = wall.points
          const dx = x2 - x1
          const dy = y2 - y1
          const wallLength = Math.sqrt(dx * dx + dy * dy)
          
          const t = ((pos.x - x1) * dx + (pos.y - y1) * dy) / (wallLength * wallLength)
          const clampedT = Math.max(0.1, Math.min(0.9, t))

          addWallOpening(wallId, {
            id: uuidv4(),
            type: activeTool,
            offset: clampedT,
            width: activeTool === 'Window' ? 60 : 80
          })
          return
        }
      }
    }

    // 3. TOOL: ROOM (POLYGON)
    if (activeTool === 'Room') {
      if (currentRoomPoints.length >= 6) {
        const firstX = currentRoomPoints[0]
        const firstY = currentRoomPoints[1]
        const dist = Math.sqrt(Math.pow(snappedX - firstX, 2) + Math.pow(snappedY - firstY, 2))
        
        if (dist < gridSize) {
          addRoom({
            id: uuidv4(),
            points: [...currentRoomPoints],
            name: `Room ${rooms.length + 1}`,
            color: '#6366F1'
          })
          setCurrentRoomPoints([])
          return
        }
      }
      setCurrentRoomPoints([...currentRoomPoints, snappedX, snappedY])
      return
    }

    // 4. TOOL: SELECTION & DELETE
    if (activeTool === 'Select') {
      const target = e.target
      const stage = target.getStage()
      const wallId = target.attrs.id?.startsWith('wall-') ? target.attrs.id.replace('wall-', '') : null
      
      if (wallId) {
        setSelectedElement({ id: wallId, type: 'Wall' })
        return
      }

      if (target.attrs.name === 'furniture-icon') {
        setSelectedElement({ id: target.attrs.id, type: 'Item' })
        return
      }

      if (target.className === 'Line' && target.attrs.closed) {
        const room = rooms.find(r => JSON.stringify(r.points) === JSON.stringify(target.attrs.points))
        if (room) {
          setSelectedElement({ id: room.id, type: 'Room' })
          return
        }
      }

      if (target === stage) {
        setSelectedElement(null)
      }
      return
    }

    // 5. TOOL: WALL (LINE)
    if (activeTool === 'Wall') {
      isDrawing.current = true
      setCurrentLine([snappedX, snappedY, snappedX, snappedY])
    }
  }

  const handleMouseMove = (e: any) => {
    const pos = getPointerPos(e)
    if (!pos) return
    const snappedX = snapToGrid(pos.x)
    const snappedY = snapToGrid(pos.y)

    if (isDrawing.current && currentLine) {
      setCurrentLine([currentLine[0], currentLine[1], snappedX, snappedY])
    }

    if (activeTool === 'Ruler' && rulerStart) {
      setRulerEnd({ x: snappedX, y: snappedY })
    }
  }

  const handleMouseUp = () => {
    if (isDrawing.current && currentLine) {
      if (currentLine[0] !== currentLine[2] || currentLine[1] !== currentLine[3]) {
        addWallLine({
          id: uuidv4(),
          points: currentLine,
          thickness: 12
        })
      }
    }
    isDrawing.current = false
    setCurrentLine(null)
    setRulerStart(null)
    setRulerEnd(null)
  }

  const handleWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    setStageScale(newScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  // Generate grid lines
  const gridLines = []
  const range = 5000 // Large range to cover pan
  for (let i = -range; i <= range; i += gridSize * 5) {
    gridLines.push(
      <Line 
        key={`grid-v-${i}`} 
        points={[i, -range, i, range]} 
        stroke="#E2E8F0" 
        strokeWidth={0.5} 
        opacity={0.5} 
      />
    )
    gridLines.push(
      <Line 
        key={`grid-h-${i}`} 
        points={[-range, i, range, i]} 
        stroke="#E2E8F0" 
        strokeWidth={0.5} 
        opacity={0.5} 
      />
    )
  }

  const resetView = () => {
    setStageScale(1)
    setStagePos({ x: 0, y: 0 })
  }

  const calculateDistance = () => {
    if (!rulerStart || !rulerEnd) return 0
    const dx = rulerEnd.x - rulerStart.x
    const dy = rulerEnd.y - rulerStart.y
    return (Math.sqrt(dx * dx + dy * dy) / 100).toFixed(2) // 100px = 1 unit (m or ft)
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#f8fafc] overflow-hidden relative">
      <Stage
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={activeTool === 'Pan'}
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
        className={
          activeTool === 'Pan' ? "cursor-grab active:cursor-grabbing" : 
          activeTool === 'Ruler' ? "cursor-help" :
          activeTool === 'Room' ? "cursor-cell" : 
          (selectedLibraryItem ? "cursor-copy" : "cursor-crosshair")
        }
      >
        <Layer>
            {gridLines}
          
          {/* Rooms / Floors */}
          {rooms.map(room => (
            <Line
              key={room.id}
              points={room.points}
              fill={room.color || '#6366F1'}
              opacity={0.1}
              closed
              stroke={room.color || '#6366F1'}
              strokeWidth={1}
            />
          ))}

          {/* Walls */}
          {wallLines.map((line) => (
            <Line
              key={line.id}
              id={`wall-${line.id}`}
              points={line.points}
              stroke={selectedElement?.id === line.id ? '#EF4444' : "#334155"}
              strokeWidth={line.thickness || 12}
              lineCap="butt"
              lineJoin="miter"
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
            />
          ))}
          
          {/* Placed Items */}
          {placedItems.map((item) => (
            <FurnitureIcon key={item.id} item={item} />
          ))}
          
          {/* Wall Preview */}
          {currentLine && (
            <Line
              points={currentLine}
              stroke="#6366F1"
              strokeWidth={12}
              lineCap="butt"
              lineJoin="miter"
              dash={[5, 5]}
            />
          )}

          {/* Ruler Tool Preview */}
          {rulerStart && rulerEnd && (
            <Group>
               <Line
                points={[rulerStart.x, rulerStart.y, rulerEnd.x, rulerEnd.y]}
                stroke="#F43F5E"
                strokeWidth={2}
                dash={[10, 5]}
              />
              <Text
                x={(rulerStart.x + rulerEnd.x) / 2}
                y={(rulerStart.y + rulerEnd.y) / 2 - 20}
                text={`${calculateDistance()}m`}
                fontSize={16}
                fill="#F43F5E"
                fontStyle="bold"
                align="center"
              />
            </Group>
          )}

          {/* Placement Preview */}
          {selectedLibraryItem && (
            <Circle radius={6} fill="#6366F1" opacity={0.3} />
          )}
        </Layer>
      </Stage>

      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-base-100/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-content/10">
        <ToolbarButton 
          active={activeTool === 'Select'} 
          onClick={() => setActiveTool('Select')} 
          icon={<MousePointer2 className="w-4 h-4" />} 
          label="Select" 
        />
        <div className="w-px h-6 bg-base-content/10 mx-1" />
        <ToolbarButton 
          active={activeTool === 'Pan'} 
          onClick={() => setActiveTool('Pan')} 
          icon={<Move className="w-4 h-4" />} 
          label="Pan (H)" 
        />
        <ToolbarButton 
          active={activeTool === 'Ruler'} 
          onClick={() => setActiveTool('Ruler')} 
          icon={<RulerIcon className="w-4 h-4" />} 
          label="Ruler (M)" 
        />
        <div className="w-px h-6 bg-base-content/10 mx-1" />
        <ToolbarButton 
          active={false} 
          onClick={() => setStageScale(s => s * 1.2)} 
          icon={<Plus className="w-4 h-4" />} 
          label="Zoom In" 
        />
        <ToolbarButton 
          active={false} 
          onClick={() => setStageScale(s => s / 1.2)} 
          icon={<Minus className="w-4 h-4" />} 
          label="Zoom Out" 
        />
        <ToolbarButton 
          active={false} 
          onClick={resetView} 
          icon={<Maximize className="w-4 h-4" />} 
          label="Reset View (R)" 
        />
      </div>
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
        <div className="bg-base-100/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-base-300 text-[10px] font-black tracking-tighter opacity-80 shadow-sm flex items-center gap-3">
          <span className="text-primary uppercase">Zoom: {Math.round(stageScale * 100)}%</span>
          <span className="w-px h-3 bg-base-content/20" />
          <span className="opacity-60">GRID: {gridSize}px</span>
        </div>
      </div>
    </div>
  )
}

const ToolbarButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <div className="tooltip tooltip-bottom" data-tip={label}>
    <button 
      onClick={onClick}
      className={`btn btn-square btn-sm rounded-xl transition-all duration-200 ${
        active ? 'btn-primary shadow-lg shadow-primary/20 scale-105' : 'btn-ghost hover:bg-base-content/5'
      }`}
    >
      {icon}
    </button>
  </div>
)

export default Floorplan2DView
