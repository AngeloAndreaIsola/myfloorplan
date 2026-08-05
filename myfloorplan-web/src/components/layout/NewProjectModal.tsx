import React from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { FilePlus as IconFilePlus, Home as IconHome, Layout as IconLayout } from 'lucide-react'

interface NewProjectModalProps {
  onClose: () => void
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const loadDemoHouse = useEditorStore((state) => state.loadDemoHouse)
  const createNewProject = useEditorStore((state) => state.createNewProject)
  
  const handleCreateBlank = () => {
    createNewProject()
    onClose()
  }

  const handleCreateDemo = () => {
    loadDemoHouse()
    onClose()
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-6">Create New Project</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="card bg-base-200 cursor-pointer hover:ring-2 ring-primary transition-all"
            onClick={handleCreateBlank}
          >
            <div className="card-body items-center text-center p-6">
              <IconFilePlus className="w-12 h-12 text-base-content/50 mb-2" />
              <h2 className="card-title text-base">Blank Project</h2>
              <p className="text-xs opacity-70">Start from scratch with an empty floorplan.</p>
            </div>
          </div>

          <div 
            className="card bg-base-200 cursor-pointer hover:ring-2 ring-primary transition-all"
            onClick={handleCreateDemo}
          >
            <div className="card-body items-center text-center p-6">
              <IconHome className="w-12 h-12 text-primary mb-2" />
              <h2 className="card-title text-base">Simple Studio</h2>
              <p className="text-xs opacity-70">A fully furnished 50m² apartment demo.</p>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </div>
  )
}

export default NewProjectModal
