import React from 'react'
import Header from './Header'
import MiniNav from './MiniNav'
import SidebarContent from './SidebarContent'
import { useEditorStore } from '../../store/useEditorStore'
import { ViewMode } from '../../types'

interface EditorLayoutProps {
  children: React.ReactNode
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ children }) => {
  const isSidebarOpen = useEditorStore((state) => state.isSidebarOpen)
  const viewMode = useEditorStore((state) => state.viewMode)
  const setViewMode = useEditorStore((state) => state.setViewMode)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-100 text-base-content font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <MiniNav />
        <SidebarContent />
        
        <main className="flex-1 relative bg-base-200 overflow-hidden shadow-inner">
          {children}
          
          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            <div className="join join-horizontal shadow-lg border border-base-300">
              <button className="btn btn-sm btn-square join-item bg-base-100 font-bold">+</button>
              <button className="btn btn-sm join-item bg-base-100 px-3 cursor-default">100%</button>
              <button className="btn btn-sm btn-square join-item bg-base-100 font-bold">-</button>
            </div>
            
            <div className="dropdown dropdown-top dropdown-end">
              <button tabIndex={0} className="btn btn-sm btn-primary shadow-lg px-4 font-bold uppercase tracking-tight">{viewMode} View</button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-28 border border-base-300 mb-2">
                <li><a className={viewMode === '2D' ? 'active' : ''} onClick={() => setViewMode('2D')}>2D View</a></li>
                <li><a className={viewMode === '3D' ? 'active' : ''} onClick={() => setViewMode('3D')}>3D View</a></li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EditorLayout
