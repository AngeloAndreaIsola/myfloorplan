import React from 'react'
import { Project } from '../../types'
import { Calendar as IconCalendar, Edit2 as IconEdit2, Trash2 as IconTrash2, FolderOpen as IconFolderOpen } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
  const { loadProject, removeProject, currentProjectId } = useEditorStore()
  const isActive = currentProjectId === project.id

  return (
    <div className={`card bg-base-200 border-2 transition-all duration-200 group ${
      isActive ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-transparent hover:border-base-300'
    }`}>
      <div className="aspect-video bg-base-300 relative overflow-hidden rounded-t-xl">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <IconFolderOpen className="w-12 h-12" />
          </div>
        )}
        {isActive && (
          <div className="absolute top-2 right-2 badge badge-primary font-bold shadow-md">ACTIVE</div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base line-clamp-1">{project.name}</h3>
          <p className="text-xs opacity-50 line-clamp-1">{project.description || 'No description'}</p>
        </div>
        
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider opacity-60">
          <span className="flex items-center gap-1">
            <IconCalendar className="w-3 h-3" />
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <span>{(project.data?.wallLines?.length ?? 0)} Walls</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button 
            onClick={() => loadProject(project.id)}
            className={`btn btn-sm ${isActive ? 'btn-disabled' : 'btn-primary'}`}
          >
            Open
          </button>
          <div className="flex gap-1">
            <button 
              onClick={() => onEdit(project)}
              className="btn btn-sm btn-square btn-ghost bg-base-300 hover:bg-base-100"
            >
              <IconEdit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => removeProject(project.id)}
              className="btn btn-sm btn-square btn-ghost text-error bg-base-300 hover:bg-error/10"
              disabled={isActive && project.name === 'Default Project'}
            >
              <IconTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
