import React, { useEffect } from 'react'
import { PointLight, SpotLight, Vector3, MeshBuilder, StandardMaterial, Color3, PointerDragBehavior } from 'babylonjs'
import { LightingItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface Light3DProps {
  light: LightingItem
}

const Light3D: React.FC<Light3DProps> = ({ light }) => {
  const { scene, shadowGenerator } = useScene()
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem)

  useEffect(() => {
    if (!scene) return

    const color = Color3.FromHexString(light.lightColor || '#FFFFFF')
    const intensity = light.intensity || 1.0
    const lightY = 100 // Ceiling height approx

    // Emissive Mesh (bulb proxy)
    const bulb = MeshBuilder.CreateSphere(`bulb-${light.id}`, { diameter: 10 }, scene)
    bulb.position = new Vector3(light.position.x, lightY, light.position.z)
    
    const mat = new StandardMaterial(`bulbMat-${light.id}`, scene)
    mat.emissiveColor = color
    mat.disableLighting = true
    bulb.material = mat

    let babylonLight: PointLight | SpotLight | null = null

    if (light.lightType === 'spot') {
      babylonLight = new SpotLight(
        `spot-${light.id}`, 
        bulb.position, 
        new Vector3(0, -1, 0), // pointing down
        Math.PI / 3, 
        2, 
        scene
      )
    } else {
      // Default to Point
      babylonLight = new PointLight(`point-${light.id}`, bulb.position, scene)
    }

    babylonLight.diffuse = color
    babylonLight.specular = color
    babylonLight.intensity = intensity
    
    if (light.range) {
      babylonLight.range = light.range
    }

    // Drag behavior for the bulb
    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) })
    bulb.addBehavior(dragBehavior)
    dragBehavior.onDragEndObservable.add(() => {
      updatePlacedItem(light.id, {
        position: { x: bulb.position.x, y: 0, z: bulb.position.z }
      })
    })

    return () => {
      bulb.dispose()
      if (babylonLight) babylonLight.dispose()
      mat.dispose()
    }
  }, [scene, light.id, light.lightType, light.lightColor, light.intensity, light.range])

  return null
}

export default Light3D
