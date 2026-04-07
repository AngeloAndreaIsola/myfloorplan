import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useEditorStore } from '../../store/useEditorStore'
import { Project } from '../../types'
import { X, Check } from 'lucide-react'

interface NewProjectDialogProps {
  onClose: () => void
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ onClose }) => {
  const { addProject } = useEditorStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    
    const newProject: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        wallLines: [],
        rooms: [],
        placedItems: []
      }
    }
    
    addProject(newProject)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-200 border border-base-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-in-center">
        <div className="p-6 border-b border-base-300 flex items-center justify-between">
          <h3 className="text-xl font-bold">New Project</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs uppercase tracking-widest opacity-60">Project Name</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g., My Dream Home" 
              className="input input-bordered bg-base-100" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs uppercase tracking-widest opacity-60">Description (Optional)</span>
            </label>
            <textarea 
              placeholder="Brief details about this project..." 
              className="textarea textarea-bordered bg-base-100 h-24" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-6 bg-base-300 flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button 
            onClick={handleCreate} 
            disabled={!name.trim()}
            className="btn btn-primary flex-1 shadow-lg"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewProjectDialog
