import React, { useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import ProjectCard from './ProjectCard'
import NewProjectDialog from './NewProjectDialog'
import ProjectEdit from './ProjectEdit'
import { Project } from '../../types'

const ProjectList: React.FC = () => {
  const { projects } = useEditorStore()
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Your Projects</h2>
        <button 
          onClick={() => setIsNewOpen(true)}
          className="btn btn-primary btn-sm px-4"
        >
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onEdit={(p) => setEditingProject(p)} 
          />
        ))}
      </div>

      {isNewOpen && (
        <NewProjectDialog 
          onClose={() => setIsNewOpen(false)} 
        />
      )}

      {editingProject && (
        <ProjectEdit 
          project={editingProject} 
          onClose={() => setEditingProject(null)} 
        />
      )}
    </div>
  )
}

export default ProjectList
