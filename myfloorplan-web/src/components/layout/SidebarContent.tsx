import React, { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { DrawTool } from '../../types'
import { X, Search, Filter, ChevronRight, Package, Home } from 'lucide-react'
import { mockFurniture, furnitureCategories } from '../../data/mockFurniture'
import PropertiesPanel from './PropertiesPanel'
import ProjectInfo from '../projects/ProjectInfo'
import { Folder } from 'lucide-react'

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
            <Folder className="w-12 h-12" />
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

  return (
    <div className="space-y-6">
      {currentProject ? (
        <ProjectInfo project={currentProject} />
      ) : (
        <div className="alert alert-warning text-xs">No project selected.</div>
      )}
      
      <div className="space-y-2">
        <button 
          onClick={saveCurrentProject}
          className="btn btn-primary btn-block btn-sm shadow-md"
        >
          Save Project
        </button>
        <button 
          onClick={() => setActiveTab('Projects')}
          className="btn btn-outline btn-block btn-sm"
        >
          View All Projects
        </button>
      </div>
    </div>
  )
}

const DrawPanel = () => {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  
  const tools: { id: DrawTool, label: string, icon: any }[] = [
    { id: 'Wall', label: 'Wall', icon: null },
    { id: 'Room', label: 'Room / Floor', icon: null },
    { id: 'Window', label: 'Window', icon: null },
    { id: 'Door', label: 'Door', icon: null },
    { id: 'Select', label: 'Select', icon: null },
  ]

  return (
    <div className="grid grid-cols-1 gap-3">
      {tools.map(tool => (
        <button 
          key={tool.id} 
          onClick={() => setActiveTool(tool.id)}
          className={`btn btn-md h-auto py-4 flex flex-col gap-1 transition-all duration-200 border-2 ${
            activeTool === tool.id 
            ? 'btn-primary shadow-lg scale-[1.02]' 
            : 'btn-outline border-base-300'
          }`}
        >
          <span className="text-[10px] uppercase font-black tracking-widest leading-none">{tool.label}</span>
          <span className="text-[8px] opacity-50 font-medium">
            {tool.id === 'Wall' && 'Drag to draw segments'}
            {tool.id === 'Room' && 'Click corners to define floor'}
            {tool.id === 'Select' && 'Interact with objects'}
          </span>
        </button>
      ))}
    </div>
  )
}

const ItemsPanel = () => {
  const selectedLibraryItem = useEditorStore((state) => state.selectedLibraryItem)
  const setSelectedLibraryItem = useEditorStore((state) => state.setSelectedLibraryItem)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredItems = mockFurniture.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory ? item.category === activeCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="form-control relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input 
            type="text" 
            placeholder="Search furniture..." 
            className="input input-sm input-bordered bg-base-200 pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            className={`btn btn-xs rounded-full ${activeCategory === null ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {furnitureCategories.slice(0, 3).map(cat => (
            <button 
              key={cat}
              className={`btn btn-xs rounded-full ${activeCategory === cat ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3 opacity-60 text-xs font-bold uppercase tracking-widest">
          <Package className="w-3 h-3" />
          <span>Results ({filteredItems.length})</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedLibraryItem(selectedLibraryItem?.id === item.id ? null : item)}
              className={`group cursor-pointer rounded-xl border-2 transition-all duration-200 p-2 bg-base-100 flex flex-col items-center gap-2 ${
                selectedLibraryItem?.id === item.id 
                ? 'border-primary shadow-lg ring-1 ring-primary/20' 
                : 'border-base-300 hover:border-primary/50'
              }`}
            >
              <div className="w-full aspect-square bg-base-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                {selectedLibraryItem?.id === item.id && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="badge badge-primary badge-sm font-bold animate-pulse">PLACING</div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-tight line-clamp-1">{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedLibraryItem && (
        <div className="alert alert-info shadow-lg p-3 text-xs bg-primary/5 border-primary/20">
          <ChevronRight className="w-4 h-4 text-primary animate-bounce-horizontal" />
          <span className="font-medium">Click on the canvas to place <b>{selectedLibraryItem.title}</b></span>
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
