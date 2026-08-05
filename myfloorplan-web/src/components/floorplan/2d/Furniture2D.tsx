import React from 'react'
import { Image as KonvaImage, Rect, Group } from 'react-konva'
import useImage from 'use-image'
import { PlacedItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useEditorStore } from '../../../store/useEditorStore'

interface Furniture2DProps {
  item: PlacedItem
  isSelected: boolean
}

const Furniture2D: React.FC<Furniture2DProps> = ({ item, isSelected }) => {
  const [image] = useImage(item.imageUrl || '')
  const { updatePlacedItem, setSelectedElement } = useEditorStore()

  const handleDragEnd = (e: any) => {
    updatePlacedItem(item.id, {
      position: { x: e.target.x(), y: 0, z: e.target.y() }
    })
  }

  const handleTransformEnd = (e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    // reset scale
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
  }

  const handleClick = (e: any) => {
    // Prevent event bubbling to stage which clears selection
    e.cancelBubble = true
    setSelectedElement({ id: item.id, type: 'Item' })
  }

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
      {(image && image.width > 0 && image.height > 0) ? (
        <KonvaImage
          image={image}
          width={50}
          height={50}
          offsetX={25}
          offsetY={25}
          shadowColor={isSelected ? '#6366F1' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          shadowOffset={{ x: 0, y: 0 }}
          shadowOpacity={0.8}
        />
      ) : (
        <Rect
          width={40}
          height={40}
          offsetX={20}
          offsetY={20}
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
