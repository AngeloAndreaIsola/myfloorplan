import React, { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { Menu as IconMenu, User as IconUser, Bell as IconBell, Search as IconSearch, Save as IconSave, Folder as IconFolder, FilePlus as IconFilePlus } from 'lucide-react'
import NewProjectModal from './NewProjectModal'

const Header: React.FC = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)

  const toggleSidebar = useEditorStore((state) => state.toggleSidebar)
  const saveCurrentProject = useEditorStore((state) => state.saveCurrentProject)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 h-16 shrink-0 z-30">
      <div className="flex-none lg:hidden">
        <button className="btn btn-square btn-ghost" onClick={toggleSidebar}>
          <IconMenu className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">My Floorplan</span>
        </div>
      </div>

      <div className="flex-none gap-2">
        <div className="form-control hidden md:block">
          <div className="input-group relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="input input-sm input-bordered pl-10 w-64 bg-base-200" 
            />
          </div>
        </div>

        <button 
          className="btn btn-ghost btn-sm tooltip tooltip-bottom" 
          data-tip="New Project"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <IconFilePlus className="w-4 h-4" />
        </button>

        <button 
          className="btn btn-ghost btn-sm tooltip tooltip-bottom" 
          data-tip="View All Projects"
          onClick={() => setActiveTab('Projects')}
        >
          <IconFolder className="w-4 h-4" />
        </button>

        <button 
          className="btn btn-primary btn-sm tooltip tooltip-bottom" 
          data-tip="Save Project"
          onClick={saveCurrentProject}
        >
          <IconSave className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <div className="divider divider-horizontal mx-0"></div>

        <button className="btn btn-ghost btn-circle btn-sm">
          <IconBell className="w-5 h-5" />
        </button>

        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar online">
            <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <IconUser className="w-full h-full p-1" />
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li><a>Profile</a></li>
            <li><a>Settings</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>

      {isNewProjectModalOpen && <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} />}
    </header>
  )
}

export default Header
