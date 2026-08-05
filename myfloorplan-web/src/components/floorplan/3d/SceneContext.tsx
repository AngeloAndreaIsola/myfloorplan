import React, { createContext, useContext, ReactNode } from 'react'
import { Scene, ShadowGenerator } from 'babylonjs'

interface SceneContextType {
  scene: Scene | null
  shadowGenerator: ShadowGenerator | null
}

const SceneContext = createContext<SceneContextType>({ scene: null, shadowGenerator: null })

export const useScene = () => useContext(SceneContext)

interface SceneProviderProps {
  scene: Scene | null
  shadowGenerator: ShadowGenerator | null
  children: ReactNode
}

export const SceneProvider: React.FC<SceneProviderProps> = ({ scene, shadowGenerator, children }) => {
  return (
    <SceneContext.Provider value={{ scene, shadowGenerator }}>
      {children}
    </SceneContext.Provider>
  )
}
