import React, { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { Project } from '../../types'
import { X, Check } from 'lucide-react'

interface ProjectEditProps {
  project: Project
  onClose: () => void
}

const ProjectEdit: React.FC<ProjectEditProps> = ({ project, onClose }) => {
  const { updateProject } = useEditorStore()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')

  const handleUpdate = () => {
    if (!name.trim()) return
    
    updateProject(project.id, {
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString()
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-200 border border-base-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-in-center">
        <div className="p-6 border-b border-base-300 flex items-center justify-between">
          <h3 className="text-xl font-bold">Edit Project</h3>
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
              className="input input-bordered bg-base-100" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs uppercase tracking-widest opacity-60">Description</span>
            </label>
            <textarea 
              className="textarea textarea-bordered bg-base-100 h-24" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-6 bg-base-300 flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button 
            onClick={handleUpdate} 
            disabled={!name.trim()}
            className="btn btn-primary flex-1 shadow-lg"
          >
            Update Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectEdit
