import React, { useEffect } from 'react'
import { MeshBuilder, Vector3, StandardMaterial, Color3, SceneLoader } from 'babylonjs'
import { StructuralElement } from '../../../../myfloorplan-shared/src/types/architecture'
import { useScene } from './SceneContext'

interface Stair3DProps {
  stair: StructuralElement
}

const Stair3D: React.FC<Stair3DProps> = ({ stair }) => {
  const { scene, shadowGenerator } = useScene()

  useEffect(() => {
    if (!scene) return

    let rootMesh: any = null

    // If there's a custom model URL, load it
    if (stair.textureUrl && stair.textureUrl.endsWith('.glb')) {
      SceneLoader.ImportMeshAsync("", "", stair.textureUrl, scene).then(result => {
        rootMesh = result.meshes[0]
        rootMesh.position = new Vector3(stair.position.x, 2, stair.position.z)
        rootMesh.rotation.y = (stair.rotation * Math.PI) / 180
        const scale = stair.dimensions.width / 100 // simplistic scale
        rootMesh.scaling = new Vector3(scale, scale, scale)
        
        rootMesh.getChildMeshes().forEach((m: any) => {
          m.receiveShadows = true
          if (shadowGenerator) shadowGenerator.addShadowCaster(m)
        })
      }).catch(e => console.warn(e))
    } else {
      // Procedural Generation
      const stepCount = stair.stepCount || 10
      const w = stair.dimensions.width
      const depth = stair.dimensions.height // run depth
      const height = stair.dimensions.depth || 120 // total height
      
      const stepDepth = depth / stepCount
      const stepHeight = height / stepCount

      rootMesh = new Vector3(stair.position.x, 2, stair.position.z) // just a pivot point
      const group = MeshBuilder.CreateBox(`stairGroup-${stair.id}`, { size: 0.1 }, scene)
      group.position = rootMesh
      group.rotation.y = (stair.rotation * Math.PI) / 180
      group.isVisible = false

      const mat = new StandardMaterial(`stairMat-${stair.id}`, scene)
      mat.diffuseColor = Color3.FromHexString(stair.color || '#CBD5E1')

      for (let i = 0; i < stepCount; i++) {
        const step = MeshBuilder.CreateBox(`step-${stair.id}-${i}`, {
          width: w,
          height: stepHeight,
          depth: stepDepth
        }, scene)
        
        // Position relative to group
        step.position = new Vector3(0, (i * stepHeight) + (stepHeight / 2), -depth/2 + (i * stepDepth) + (stepDepth/2))
        step.material = mat
        step.setParent(group)
        step.receiveShadows = true
        if (shadowGenerator) shadowGenerator.addShadowCaster(step)
      }

      rootMesh = group
    }

    return () => {
      if (rootMesh) rootMesh.dispose()
    }
  }, [scene, stair, shadowGenerator])

  return null
}

export default Stair3D
