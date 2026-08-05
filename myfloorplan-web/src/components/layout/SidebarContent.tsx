import React, { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { DrawTool } from '../../types'
import { Search as IconSearch, Filter as IconFilter, ChevronRight as IconChevronRight, Package as IconPackage, Home as IconHome, RefreshCw, X } from 'lucide-react'
import { furnitureCategories } from '../../data/mockFurniture'
import PropertiesPanel from './PropertiesPanel'
import ProjectInfo from '../projects/ProjectInfo'
import { Folder as IconFolder, Plus as IconPlus } from 'lucide-react'

const SidebarContent: React.FC = () => {
  const activeTab = useEditorStore((state) => state.activeTab)
  const isSidebarOpen = useEditorStore((state) => state.isSidebarOpen)
  const setSidebarOpen = useEditorStore((state) => state.setSidebarOpen)

  if (!isSidebarOpen) return null

  return (
    <aside className="w-80 bg-base-100 flex flex-col border-r border-base-300 transition-all duration-300 overflow-hidden shrink-0">
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <h2 className="font-bold text-lg uppercase tracking-wider text-base-content/70">{activeTab}</h2>
        <button 
          className="btn btn-ghost btn-xs btn-circle lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'Home' && <HomePanel />}
        {activeTab === 'Draw' && <DrawPanel />}
        {activeTab === 'Items' && <ItemsPanel />}
        {activeTab === 'Settings' && <SettingsPanel />}
        {activeTab === 'Projects' && (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
            <IconFolder className="w-12 h-12" />
            <p className="text-center px-4 font-medium">Use the "Projects" view in the main area to manage your floorplans.</p>
          </div>
        )}
        
        {/* Properties Panel (Contextual) */}
        <div className="mt-6 pt-6 border-t border-base-300">
          <PropertiesPanel />
        </div>

        {/* Fallback for other tabs */}
        {!['Home', 'Draw', 'Items', 'Properties', 'Settings', 'Projects'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
            <p>Content for {activeTab} is coming soon.</p>
          </div>
        )}
      </div>
    </aside>
  )
}

const HomePanel = () => {
  const projects = useEditorStore((state) => state.projects)
  const currentProjectId = useEditorStore((state) => state.currentProjectId)
  const saveCurrentProject = useEditorStore((state) => state.saveCurrentProject)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)
  const currentProject = projects.find(p => p.id === currentProjectId)

  const floors = useEditorStore((state) => state.floors)
  const currentFloorId = useEditorStore((state) => state.currentFloorId)
  const addFloor = useEditorStore((state) => state.addFloor)
  const switchFloor = useEditorStore((state) => state.switchFloor)

  return (
    <div className="space-y-6">
      {currentProject ? (
        <ProjectInfo project={currentProject} />
      ) : (
        <div className="alert alert-warning text-xs">No project selected.</div>
      )}

      {/* Floor Manager */}
      <div className="space-y-2 bg-base-200 p-3 rounded-xl border border-base-300">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content/50 px-1">Floors</h3>
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => switchFloor(floor.id)}
              className={`btn btn-sm justify-start ${currentFloorId === floor.id ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
            >
              {floor.name}
            </button>
          ))}
        </div>
        <button 
          onClick={() => addFloor(`Level ${floors.length + 1}`, floors.length + 1)}
          className="btn btn-outline btn-block btn-xs mt-2"
        >
          <IconPlus className="w-3 h-3" /> Add Floor
        </button>
      </div>
    </div>
  )
}

const DrawPanel = () => {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  
  const tools: { id: DrawTool, label: string, category: string }[] = [
    { id: 'Select', label: 'Pointer Tool', category: 'General' },
    { id: 'Wall', label: 'Draw Wall', category: 'Structural' },
    { id: 'Room', label: 'Create Floor', category: 'Structural' },
    { id: 'Stair', label: 'Place Stair', category: 'Structural' },
    { id: 'Door', label: 'Place Door', category: 'Openings' },
    { id: 'Window', label: 'Place Window', category: 'Openings' },
    { id: 'Light', label: 'Place Light', category: 'Decor' },
    { id: 'WallDecor', label: 'Wall Decor', category: 'Decor' },
  ]

  return (
    <div className="space-y-6">
      {['General', 'Structural', 'Openings', 'Decor'].map(category => (
        <div key={category} className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content/50 px-1">{category}</h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.filter(t => t.category === category).map(tool => (
              <button 
                key={tool.id} 
                onClick={() => setActiveTool(tool.id)}
                className={`btn btn-sm h-16 flex flex-col items-center justify-center gap-1 transition-all duration-200 border-2 rounded-xl ${
                  activeTool === tool.id 
                  ? 'btn-primary shadow-lg ring-2 ring-primary/20 scale-[1.02] border-primary' 
                  : 'btn-ghost bg-base-200 border-base-300 hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider leading-tight text-center">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const ItemsPanel = () => {
  const selectedLibraryItem = useEditorStore((state) => state.selectedLibraryItem)
  const setSelectedLibraryItem = useEditorStore((state) => state.setSelectedLibraryItem)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const globalAssets = useEditorStore((state) => state.globalAssets)
  const fetchGlobalAssets = useEditorStore((state) => state.fetchGlobalAssets)
  
  React.useEffect(() => {
    if (globalAssets.length === 0) {
      fetchGlobalAssets();
    }
  }, [fetchGlobalAssets, globalAssets.length]);

  const filteredItems = globalAssets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory ? (item.category === activeCategory || (item as any).itemObjectType === activeCategory) : true
    const itemTags = (item as any).itemTags || []
    const matchesTag = activeTag ? itemTags.includes(activeTag) : true
    const isModel = item.assetType === 'model'
    return matchesSearch && matchesCategory && matchesTag && isModel
  })

  // Derive unique categories and tags
  const categories = Array.from(new Set(globalAssets
    .filter(item => item.assetType === 'model')
    .flatMap(item => [item.category, (item as any).itemObjectType])
    .filter(Boolean) as string[]
  )).sort()

  const allTags = Array.from(new Set(globalAssets
    .filter(item => item.assetType === 'model')
    .flatMap(item => (item as any).itemTags || [])
    .filter(Boolean) as string[]
  )).sort()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="form-control relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            className="input input-sm input-bordered bg-base-200 pl-10 rounded-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
          <button 
            className={`btn btn-xs rounded-full shrink-0 ${activeCategory === null ? 'btn-primary shadow-md' : 'btn-ghost bg-base-200'}`}
            onClick={() => setActiveCategory(null)}
          >
            All Types
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn btn-xs rounded-full shrink-0 ${activeCategory === cat ? 'btn-primary shadow-md' : 'btn-ghost bg-base-200'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar border-t border-base-300 pt-2">
            <button 
              className={`btn btn-xs rounded-full shrink-0 ${activeTag === null ? 'btn-secondary shadow-md' : 'btn-ghost bg-base-200'}`}
              onClick={() => setActiveTag(null)}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                className={`btn btn-xs rounded-full shrink-0 ${activeTag === tag ? 'btn-secondary shadow-md' : 'btn-ghost bg-base-200'}`}
                onClick={() => setActiveTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 opacity-60 text-[10px] font-black uppercase tracking-widest px-1">
            <IconPackage className="w-3 h-3" />
            <span>Catalog ({filteredItems.length})</span>
          </div>
          <button onClick={() => fetchGlobalAssets()} className="btn btn-ghost btn-xs">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => {
            const r2PublicDomain = 'https://pub-0aad5cebf0744360b97f9343ac54fa55.r2.dev';
            const imageUrl = item.thumbnailUrl ? (item.thumbnailUrl.startsWith('/') ? `${r2PublicDomain}${item.thumbnailUrl}` : item.thumbnailUrl) : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=2158';
            const modelUrl = item.downloadUrl ? (item.downloadUrl.startsWith('/') ? `${r2PublicDomain}${item.downloadUrl}` : item.downloadUrl) : '';
            
            const mappedLibraryItem = {
              id: item.assetId,
              title: item.name,
              category: (item as any).itemObjectType || item.category,
              dimensions: { 
                width: (item as any).itemWidth / 100 || 1, 
                height: (item as any).itemHeight / 100 || 1, 
                depth: 1 
              },
              imageUrl,
              modelUrl,
              type: 'furniture',
              tags: (item as any).itemTags || []
            };
            return (
            <div 
              key={item.assetId}
              onClick={() => setSelectedLibraryItem(selectedLibraryItem?.id === item.assetId ? null : mappedLibraryItem as any)}
              className={`group cursor-pointer rounded-2xl border-2 transition-all duration-300 p-2 bg-base-100 flex flex-col items-center gap-2 overflow-hidden relative ${
                selectedLibraryItem?.id === item.assetId 
                ? 'border-primary shadow-xl ring-4 ring-primary/10 scale-[1.02]' 
                : 'border-base-300 hover:border-primary/40'
              }`}
            >
              <div className="w-full aspect-square bg-base-200/50 rounded-xl overflow-hidden flex items-center justify-center relative">
                <img src={mappedLibraryItem.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                {selectedLibraryItem?.id === item.assetId && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-all">
                    <div className="badge badge-primary font-bold shadow-lg shadow-primary/50 animate-bounce">SELECTED</div>
                  </div>
                )}
              </div>
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-bold text-center uppercase tracking-wider line-clamp-1 w-full truncate px-1" title={item.name}>{item.name}</span>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="text-[8px] opacity-50 uppercase tracking-widest badge badge-ghost badge-xs">{(item as any).itemObjectType || item.category}</span>
                  {((item as any).itemTags || []).slice(0, 2).map((tag: string) => (
                    <span key={tag} className="text-[7px] opacity-40 uppercase tracking-tighter">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {selectedLibraryItem && (
        <div className="fixed bottom-6 left-6 w-72 alert shadow-2xl bg-base-100 border-2 border-primary z-50 animate-in slide-in-from-bottom-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
               <img src={selectedLibraryItem.imageUrl} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Placing: {selectedLibraryItem.title}</span>
              <span className="text-[10px] opacity-70">Click anywhere on the canvas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SettingsPanel = () => (
  <div className="form-control space-y-4">
    <label className="label cursor-pointer p-4 bg-base-200 rounded-lg">
      <span className="label-text font-medium">Show Grid</span> 
      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
    </label>
    <label className="label cursor-pointer p-4 bg-base-200 rounded-lg">
      <span className="label-text font-medium">Snap to Grid</span> 
      <input type="checkbox" className="toggle toggle-secondary" defaultChecked />
    </label>
    <div className="space-y-2">
      <span className="label-text font-medium px-1">Units</span>
      <select className="select select-bordered select-sm w-full bg-base-200">
        <option>Meters</option>
        <option>Feet</option>
      </select>
    </div>
  </div>
)

export default SidebarContent
