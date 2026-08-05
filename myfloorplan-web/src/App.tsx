import React, { useEffect } from 'react'
import EditorLayout from './components/layout/EditorLayout'
import Floorplan2DView from './components/editor/Floorplan2DView'
import Floorplan3DView from './components/editor/Floorplan3DView'
import ProjectList from './components/projects/ProjectList'
import { useEditorStore } from './store/useEditorStore'
import { useAuthStore } from './store/useAuthStore'
import { signInAnonymously } from 'firebase/auth'
import { auth } from './lib/firebase'
import { api } from './lib/api'

const App = () => {
  const viewMode = useEditorStore((state) => state.viewMode)
  const activeTab = useEditorStore((state) => state.activeTab)
  const fetchProjects = useEditorStore((state) => state.fetchProjects)
  
  const { user, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    if (user) {
      // Sync user to backend and fetch their projects
      api.syncUser(user.email || 'anonymous@floorplan.local').then(() => {
        fetchProjects()
      })
    }
  }, [user])

  const handleLogin = async () => {
    // For demo purposes, we do anonymous login
    await signInAnonymously(auth)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-base-300 text-white">Loading Authentication...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-300">
        <div className="card w-96 bg-base-100 shadow-xl border border-base-200">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-primary">MyFloorplan</h2>
            <p className="text-sm text-base-content/70">Please sign in to access your projects.</p>
            <div className="card-actions mt-4 w-full">
              <button className="btn btn-primary w-full" onClick={handleLogin}>Log In (Anonymous)</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
