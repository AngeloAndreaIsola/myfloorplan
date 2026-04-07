import React from 'react'
import { Project } from '../../types'
import { Calendar, User, Info, Clock } from 'lucide-react'

interface ProjectInfoProps {
  project: Project
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ project }) => {
  return (
    <div className="card bg-base-300 p-4 border border-base-100 shadow-inner">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-tight">{project.name}</h3>
          <p className="text-xs opacity-60 leading-relaxed line-clamp-2">
            {project.description || 'No description provided for this project.'}
          </p>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
            <Calendar className="w-2 h-2" /> Created
          </span>
          <span className="text-sm font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
            <Clock className="w-2 h-2" /> Modified
          </span>
          <span className="text-sm font-medium">{new Date(project.updatedAt).toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-base-content/10">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest opacity-40">
          <span>Project Statistics</span>
        </div>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center bg-base-100/30 p-2 rounded">
            <span className="text-xs opacity-60">Wall Segments</span>
            <span className="badge badge-sm badge-neutral">{project.data.wallLines.length}</span>
          </div>
          <div className="flex justify-between items-center bg-base-100/30 p-2 rounded">
            <span className="text-xs opacity-60">Rooms Created</span>
            <span className="badge badge-sm badge-neutral">{project.data.rooms.length}</span>
          </div>
          <div className="flex justify-between items-center bg-base-100/30 p-2 rounded">
            <span className="text-xs opacity-60">Furniture Items</span>
            <span className="badge badge-sm badge-neutral">{project.data.placedItems.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectInfo
