import React, { useRef, useEffect, useCallback } from 'react'
import { Image as KonvaImage, Rect, Group, Circle, Stage as KonvaStage, Layer } from 'react-konva'
import useImage from 'use-image'
import { PlacedItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useEditorStore } from '../../../store/useEditorStore'

interface Furniture2DProps {
  item: PlacedItem
  isSelected: boolean
}

const FURNITURE_SIZE = 50
const HANDLE_RADIUS = 8
const HANDLE_OFFSET = 35 // distance from center to rotation handle

const Furniture2D: React.FC<Furniture2DProps> = ({ item, isSelected }) => {
  const [image] = useImage(item.imageUrl || '')
  const { updatePlacedItem, setSelectedElement } = useEditorStore()
  
  // Refs for rotation drag tracking
  const rotatingRef = useRef(false)
  const startAngleRef = useRef(0)
  const startRotationRef = useRef(0)
  const furnitureCenterRef = useRef({ x: item.position.x, y: item.position.z })

  // Update center ref when item position changes
  useEffect(() => {
    furnitureCenterRef.current = { x: item.position.x, y: item.position.z }
  }, [item.position.x, item.position.z])

  const handleDragEnd = useCallback((e: any) => {
    updatePlacedItem(item.id, {
      position: { x: e.target.x(), y: 0, z: e.target.y() }
    })
  }, [item.id, updatePlacedItem])

  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    
    updatePlacedItem(item.id, {
      position: { x: node.x(), y: 0, z: node.y() },
      rotation: node.rotation(),
      scale: {
        x: (item.scale?.x || 1) * scaleX,
        y: (item.scale?.y || 1) * scaleY,
        z: item.scale?.z || 1
      }
    })
  }, [item.id, item.scale, updatePlacedItem])

  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true
    setSelectedElement({ id: item.id, type: 'Item' })
  }, [item.id, setSelectedElement])

  // Rotation handle mouse down - start tracking
  const handleRotationMouseDown = useCallback((e: any) => {
    e.cancelBubble = true
    e.preventDefault()
    
    rotatingRef.current = true
    startRotationRef.current = item.rotation
    
    // Get the stage and current pointer position
    const stage = e.target.getStage()
    if (!stage) return
    
    const pointerPos = stage.getPointerPosition()
    if (!pointerPos) return
    
    const center = furnitureCenterRef.current
    startAngleRef.current = Math.atan2(
      pointerPos.y - center.y,
      pointerPos.x - center.x
    ) * (180 / Math.PI)
    
    // Add stage-level move/up listeners
    const onStageMouseMove = (e: any) => {
      if (!rotatingRef.current) return
      
      const s = e.target.getStage()
      if (!s) return
      
      const pos = s.getPointerPosition()
      if (!pos) return
      
      const center = furnitureCenterRef.current
      const currentAngle = Math.atan2(
        pos.y - center.y,
        pos.x - center.x
      ) * (180 / Math.PI)
      
      let newRotation = currentAngle - startAngleRef.current + startRotationRef.current
      newRotation = ((newRotation % 360) + 360) % 360
      
      updatePlacedItem(item.id, { rotation: Math.round(newRotation) })
    }
    
    const onStageMouseUp = () => {
      rotatingRef.current = false
      stage.removeEventListener('mousemove', onStageMouseMove)
      stage.removeEventListener('mouseup', onStageMouseUp)
    }
    
    stage.addEventListener('mousemove', onStageMouseMove)
    stage.addEventListener('mouseup', onStageMouseUp)
  }, [item.id, item.rotation, updatePlacedItem])

  const handleRotationClick = useCallback((e: any) => {
    e.cancelBubble = true
    setSelectedElement({ id: item.id, type: 'Item' })
  }, [item.id, setSelectedElement])

  const commonProps = {
    x: item.position.x,
    y: item.position.z,
    scaleX: Math.max(0.01, item.scale?.x ?? 1),
    scaleY: Math.max(0.01, item.scale?.y ?? 1),
    rotation: item.rotation,
    draggable: true,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onClick: handleClick,
    onTap: handleClick,
  }

  return (
    <Group
      id={item.id}
      name="furniture-icon"
      {...commonProps}
    >
      {/* Rotation handle - visible only when selected */}
      {isSelected && (
        <Circle
          x={HANDLE_OFFSET}
          y={0}
          radius={HANDLE_RADIUS}
          fill="#6366F1"
          stroke="#FFFFFF"
          strokeWidth={2}
          draggable={false}
          onMouseDown={handleRotationMouseDown}
          onClick={handleRotationClick}
          onTap={handleRotationClick}
        />
      )}

      {(image && image.width > 0 && image.height > 0) ? (
        <KonvaImage
          image={image}
          width={FURNITURE_SIZE}
          height={FURNITURE_SIZE}
          offsetX={FURNITURE_SIZE / 2}
          offsetY={FURNITURE_SIZE / 2}
          shadowColor={isSelected ? '#6366F1' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          shadowOffset={{ x: 0, y: 0 }}
          shadowOpacity={0.8}
        />
      ) : (
        <Rect
          width={FURNITURE_SIZE}
          height={FURNITURE_SIZE}
          offsetX={FURNITURE_SIZE / 2}
          offsetY={FURNITURE_SIZE / 2}
          fill={isSelected ? '#4F46E5' : '#6366F1'}
          stroke={isSelected ? '#FFFFFF' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
          shadowColor={isSelected ? '#4F46E5' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          cornerRadius={4}
        />
      )}
    </Group>
  )
}

export default Furniture2D
