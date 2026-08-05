import React from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { SelectedType } from '../../types'
import { formatUnit } from '../../utils/units'

const TEXTURE_PRESETS = [
  { name: 'None', url: '', type: 'color' },
  { name: 'Light Wood', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=2069', type: 'texture' },
  { name: 'Dark Wood', url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=2070', type: 'texture' },
  { name: 'White Tile', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2070', type: 'texture' },
  { name: 'Grey Concrete', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2070', type: 'texture' },
  { name: 'Red Brick', url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=1974', type: 'texture' },
  { name: 'Vintage Floral', url: 'https://images.unsplash.com/photo-1618220179428-22790b46a0eb?auto=format&fit=crop&q=80&w=2000', type: 'wallpaper' },
  { name: 'Modern Geometric', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000', type: 'wallpaper' }
]

const PropertiesPanel: React.FC = () => {
  const { 
    selectedElement, setSelectedElement,
    wallLines, updateWallLine, updateWallOpening,
    rooms, updateRoom,
    placedItems, updatePlacedItem,
    renderSettings
  } = useEditorStore()

  if (!selectedElement) return null

  const { id, type, parentId } = selectedElement

  const renderMaterialGrid = (currentUrl: string | undefined, onChange: (url: string) => void) => (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {TEXTURE_PRESETS.map((p) => (
        <div 
          key={p.name}
          className={`aspect-square rounded-lg border-2 cursor-pointer overflow-hidden transition-all ${currentUrl === p.url ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-base-300 hover:border-primary/50'}`}
          onClick={() => onChange(p.url)}
          title={p.name}
        >
          {p.url ? (
            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-base-100 flex items-center justify-center text-xs opacity-50">None</div>
          )}
        </div>
      ))}
    </div>
  )

  const renderWallProps = () => {
    const wall = wallLines.find(w => w.id === id)
    if (!wall) return null

    return (
      <div className="space-y-6">
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Thickness ({formatUnit(wall.thickness || 12, renderSettings.unitSystem)})</span></label>
          <input 
            type="range" min="4" max="40" 
            value={wall.thickness || 12} 
            onChange={(e) => updateWallLine(id, { thickness: parseInt(e.target.value) })}
            className="range range-xs range-primary" 
          />
        </div>
        
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Base Color</span></label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={wall.color || '#4A5568'} 
              onChange={(e) => updateWallLine(id, { color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent"
            />
            <input 
              type="text" 
              value={wall.color || '#4A5568'} 
              onChange={(e) => updateWallLine(id, { color: e.target.value })}
              className="input input-sm input-bordered flex-1 uppercase font-mono text-xs"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Wall Material / Wallpaper</span></label>
          {renderMaterialGrid(wall.textureUrl, (url) => updateWallLine(id, { textureUrl: url }))}
        </div>

        {wall.openings && wall.openings.length > 0 && (
          <div className="form-control mt-4 border-t border-base-300 pt-4">
            <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Attached Elements</span></label>
            <ul className="menu menu-xs bg-base-200/50 rounded-box w-full p-2 gap-1">
              {wall.openings.map(opening => (
                <li key={opening.id}>
                  <a onClick={() => setSelectedElement({ id: `opening-${opening.id}`, type: 'Opening', parentId: wall.id })}>
                    <div className={`w-2 h-2 rounded-full ${opening.type === 'Door' ? 'bg-secondary' : 'bg-info'}`}></div>
                    {opening.type} {(opening.offset * 100).toFixed(0)}%
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderRoomProps = () => {
    const room = rooms.find(r => r.id === id)
    if (!room) return null

    return (
      <div className="space-y-6">
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Room Name</span></label>
          <input 
            type="text" 
            value={room.name || ''} 
            onChange={(e) => updateRoom(id, { name: e.target.value })}
            className="input input-bordered input-sm bg-base-200"
            placeholder="e.g. Master Bedroom"
          />
        </div>
        
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Floor Color</span></label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={room.color || '#6366F1'} 
              onChange={(e) => updateRoom(id, { color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Floor Material</span></label>
          {renderMaterialGrid(room.textureUrl, (url) => updateRoom(id, { textureUrl: url }))}
        </div>
      </div>
    )
  }

  const renderItemProps = () => {
    const item = placedItems.find(i => i.id === id)
    if (!item) return null

    return (
      <div className="space-y-6">
        <div className="badge badge-primary badge-outline text-xs font-bold uppercase tracking-widest">{item.category}</div>
        
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Rotation ({item.rotation}°)</span></label>
          <input 
            type="range" min="0" max="360" step="5"
            value={item.rotation} 
            onChange={(e) => updatePlacedItem(id, { rotation: parseInt(e.target.value) })}
            className="range range-xs range-secondary" 
          />
        </div>
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Scale X ({item.scale?.x?.toFixed(2) || '1.00'}x)</span></label>
          <input 
            type="range" min="0.5" max="3" step="0.05"
            value={item.scale?.x || 1} 
            onChange={(e) => updatePlacedItem(id, { scale: { ...(item.scale || {x: 1, y: 1}), x: parseFloat(e.target.value) } })}
            className="range range-xs range-accent" 
          />
        </div>
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Scale Y ({item.scale?.y?.toFixed(2) || '1.00'}x)</span></label>
          <input 
            type="range" min="0.5" max="3" step="0.05"
            value={item.scale?.y || 1} 
            onChange={(e) => updatePlacedItem(id, { scale: { ...(item.scale || {x: 1, y: 1}), y: parseFloat(e.target.value) } })}
            className="range range-xs range-accent" 
          />
        </div>
      </div>
    )
  }

  const renderOpeningProps = () => {
    if (!parentId) return null
    const wall = wallLines.find(w => w.id === parentId)
    if (!wall) return null
    const openingId = id.replace('opening-', '')
    const opening = wall.openings?.find(o => o.id === openingId)
    if (!opening) return null

    return (
      <div className="space-y-6">
        <div className="badge badge-secondary badge-outline text-xs font-bold uppercase tracking-widest">{opening.type}</div>
        
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Offset ({(opening.offset * 100).toFixed(0)}%)</span></label>
          <input 
            type="range" min="0.05" max="0.95" step="0.01"
            value={opening.offset} 
            onChange={(e) => updateWallOpening(parentId, openingId, { offset: parseFloat(e.target.value) })}
            className="range range-xs range-primary" 
          />
        </div>
        
        <div className="form-control">
          <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Width ({formatUnit(opening.dimensions?.width || (opening.type === 'Window' ? 60 : 80), renderSettings.unitSystem)})</span></label>
          <input 
            type="range" min="20" max="200" step="5"
            value={opening.dimensions?.width || (opening.type === 'Window' ? 60 : 80)} 
            onChange={(e) => updateWallOpening(parentId, openingId, { 
              dimensions: { ...opening.dimensions, width: parseInt(e.target.value), height: opening.dimensions?.height || 200, depth: opening.dimensions?.depth || 10 } 
            })}
            className="range range-xs range-secondary" 
          />
        </div>

        {opening.type === 'Door' && (
          <div className="form-control">
            <label className="label py-1"><span className="label-text font-bold text-xs uppercase tracking-wider opacity-70">Style</span></label>
            <select 
              className="select select-bordered select-sm w-full"
              value={opening.styleId || 'single'}
              onChange={(e) => updateWallOpening(parentId, openingId, { styleId: e.target.value })}
            >
              <option value="single">Single Swing</option>
              <option value="double-door">Double Doors</option>
              <option value="sliding-glass">Sliding Glass</option>
            </select>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-base-100/90 backdrop-blur-md rounded-xl border border-base-300 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center p-3 border-b border-base-300 bg-base-200/50">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          {type} Inspector
        </h3>
        <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setSelectedElement(null)}>✕</button>
      </div>

      <div className="p-4 custom-scrollbar max-h-[60vh] overflow-y-auto">
        {type === 'Wall' && renderWallProps()}
        {type === 'Room' && renderRoomProps()}
        {type === 'Item' && renderItemProps()}
        {type === 'Opening' && renderOpeningProps()}
      </div>
    </div>
  )
}

export default PropertiesPanel
