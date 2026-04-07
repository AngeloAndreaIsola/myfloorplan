import React from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { SelectedType } from '../../types'

const TEXTURE_PRESETS = [
  { name: 'None', url: '' },
  { name: 'Light Wood', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=2069' },
  { name: 'Dark Wood', url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=2070' },
  { name: 'White Tile', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2070' },
  { name: 'Grey Concrete', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2070' },
  { name: 'Red Brick', url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=1974' }
]

const PropertiesPanel: React.FC = () => {
  const { 
    selectedElement, setSelectedElement,
    wallLines, updateWallLine,
    rooms, updateRoom,
    placedItems, updatePlacedItem
  } = useEditorStore()

  if (!selectedElement) return null

  const { id, type } = selectedElement

  const renderWallProps = () => {
    const wall = wallLines.find(w => w.id === id)
    if (!wall) return null

    return (
      <div className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Thickness</span></label>
          <input 
            type="range" min="4" max="40" 
            value={wall.thickness || 12} 
            onChange={(e) => updateWallLine(id, { thickness: parseInt(e.target.value) })}
            className="range range-xs range-primary" 
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Wall Color</span></label>
          <input 
            type="color" 
            value={wall.color || '#4A5568'} 
            onChange={(e) => updateWallLine(id, { color: e.target.value })}
            className="input input-sm p-1 h-10 w-full"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Texture</span></label>
          <select 
            className="select select-bordered select-sm w-full"
            value={wall.textureUrl || ''}
            onChange={(e) => updateWallLine(id, { textureUrl: e.target.value })}
          >
            {TEXTURE_PRESETS.map(p => <option key={p.name} value={p.url}>{p.name}</option>)}
          </select>
        </div>
      </div>
    )
  }

  const renderRoomProps = () => {
    const room = rooms.find(r => r.id === id)
    if (!room) return null

    return (
      <div className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Room Name</span></label>
          <input 
            type="text" 
            value={room.name || ''} 
            onChange={(e) => updateRoom(id, { name: e.target.value })}
            className="input input-bordered input-sm"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Floor Color</span></label>
          <input 
            type="color" 
            value={room.color || '#6366F1'} 
            onChange={(e) => updateRoom(id, { color: e.target.value })}
            className="input input-sm p-1 h-10 w-full"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Floor Texture</span></label>
          <select 
            className="select select-bordered select-sm w-full"
            value={room.textureUrl || ''}
            onChange={(e) => updateRoom(id, { textureUrl: e.target.value })}
          >
            {TEXTURE_PRESETS.map(p => <option key={p.name} value={p.url}>{p.name}</option>)}
          </select>
        </div>
      </div>
    )
  }

  const renderItemProps = () => {
    const item = placedItems.find(i => i.id === id)
    if (!item) return null

    return (
      <div className="space-y-4">
        <p className="text-xs font-bold opacity-60 uppercase">{item.type}</p>
        <div className="form-control">
          <label className="label"><span className="label-text">Rotation ({item.rotation}°)</span></label>
          <input 
            type="range" min="0" max="360" step="15"
            value={item.rotation} 
            onChange={(e) => updatePlacedItem(id, { rotation: parseInt(e.target.value) })}
            className="range range-xs range-secondary" 
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Scale ({item.scale.toFixed(1)}x)</span></label>
          <input 
            type="range" min="0.5" max="3" step="0.1"
            value={item.scale} 
            onChange={(e) => updatePlacedItem(id, { scale: parseFloat(e.target.value) })}
            className="range range-xs range-accent" 
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-base-200/50 rounded-xl border border-base-300 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest">{type} Properties</h3>
        <button className="btn btn-ghost btn-xs h-6 w-6 p-0 min-h-0" onClick={() => setSelectedElement(null)}>✕</button>
      </div>

      {type === 'Wall' && renderWallProps()}
      {type === 'Room' && renderRoomProps()}
      {type === 'Item' && renderItemProps()}
    </div>
  )
}

export default PropertiesPanel
