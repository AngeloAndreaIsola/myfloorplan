import React, { useEffect } from 'react'
import EditorLayout from './components/layout/EditorLayout'
import Floorplan2DView from './components/editor/Floorplan2DView'
import Floorplan3DView from './components/editor/Floorplan3DView'
import ProjectList from './components/projects/ProjectList'
import { useEditorStore } from './store/useEditorStore'
import { api } from './lib/api'

const App = () => {
  const viewMode = useEditorStore((state) => state.viewMode)
  const activeTab = useEditorStore((state) => state.activeTab)
  const fetchProjects = useEditorStore((state) => state.fetchProjects)
  const projects = useEditorStore((state) => state.projects)
  const loadDemoHouse = useEditorStore((state) => state.loadDemoHouse)

  // Auto-load demo house on first render if no projects exist
  useEffect(() => {
    if (projects.length === 0) {
      loadDemoHouse()
    }
  }, [])

  return (
    <EditorLayout>
      <div className="w-full h-full relative">
        {activeTab === 'Projects' ? (
          <div className="p-8 h-full overflow-y-auto">
            <ProjectList />
          </div>
        ) : viewMode === '2D' ? (
          <Floorplan2DView />
        ) : (
          <Floorplan3DView />
        )}
      </div>
    </EditorLayout>
  )
}

export default App
