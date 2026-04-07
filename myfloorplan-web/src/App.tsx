import React from 'react'
import EditorLayout from './components/layout/EditorLayout'
import Floorplan2DView from './components/editor/Floorplan2DView'
import Floorplan3DView from './components/editor/Floorplan3DView'
import ProjectList from './components/projects/ProjectList'
import { useEditorStore } from './store/useEditorStore'

const App = () => {
  const viewMode = useEditorStore((state) => state.viewMode)
  const activeTab = useEditorStore((state) => state.activeTab)

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
