import React from 'react'
import { Line } from 'react-konva'
import { Room } from '../../../../myfloorplan-shared/src/types/architecture'

interface Room2DProps {
  room: Room
  isSelected: boolean
}

const Room2D: React.FC<Room2DProps> = ({ room, isSelected }) => {
  return (
    <Line
      points={room.points}
      fill={room.color || '#6366F1'}
      opacity={isSelected ? 0.3 : 0.1}
      closed
      stroke={isSelected ? '#4F46E5' : room.color || '#6366F1'}
      strokeWidth={isSelected ? 3 : 1}
      name="room"
      id={room.id}
    />
  )
}

export default Room2D
