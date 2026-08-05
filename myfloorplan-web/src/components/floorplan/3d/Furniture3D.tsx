import React, { useEffect } from 'react'
import { SceneLoader, Vector3, MeshBuilder, PointerDragBehavior } from 'babylonjs'
import { PlacedItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface Furniture3DProps {
  item: PlacedItem
}

const Furniture3D: React.FC<Furniture3DProps> = ({ item }) => {
  const { scene, shadowGenerator } = useScene()
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem)

  useEffect(() => {
    if (!scene) return

    let rootMesh: any = null

    const loadMesh = async () => {
      if (item.modelUrl) {
        try {
          const r2PublicDomain = 'https://pub-0aad5cebf0744360b97f9343ac54fa55.r2.dev';
          const fullUrl = item.modelUrl.startsWith('/') ? `${r2PublicDomain}${item.modelUrl}` : item.modelUrl;
          const result = await SceneLoader.ImportMeshAsync("", "", fullUrl, scene);
          rootMesh = result.meshes[0];
        } catch (e) {
          rootMesh = MeshBuilder.CreateBox(`fallback-${item.id}`, { size: 40 }, scene)
        }
      } else {
        rootMesh = MeshBuilder.CreateBox(`fallback-${item.id}`, { size: 40 }, scene)
      }

      rootMesh.position = new Vector3(item.position.x, 2, item.position.z)
      rootMesh.rotationQuaternion = null
      rootMesh.rotation.y = (item.rotation * Math.PI) / 180
      
      // If it's a fallback box, don't scale it up 100x
      if (item.modelUrl && rootMesh.name !== `fallback-${item.id}`) {
        const scaleX = item.scale?.x || 1
        const scaleY = item.scale?.y || 1
        const scaleZ = item.scale?.z || 1
        // Usually, 3D models need uniform scaling or non-uniform scaling mapping Y to Z in babylon (since Y is up)
        rootMesh.scaling = new Vector3(scaleX * 100, scaleZ * 100, scaleY * 100)
      } else {
        const scaleX = item.scale?.x || 1
        const scaleY = item.scale?.y || 1
        const scaleZ = item.scale?.z || 1
        rootMesh.scaling = new Vector3(scaleX, scaleZ, scaleY)
      }

      rootMesh.getChildMeshes().forEach((m: any) => {
        m.receiveShadows = true
        if (shadowGenerator) shadowGenerator.addShadowCaster(m)
      })

      // Add Drag and Drop Support
      const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) })
      rootMesh.addBehavior(dragBehavior)
      
      dragBehavior.onDragEndObservable.add((event) => {
        // Snap to grid or just update raw position
        updatePlacedItem(item.id, {
          position: { 
            x: rootMesh.position.x, 
            y: rootMesh.position.y, 
            z: rootMesh.position.z 
          }
        })
      })
    }

    loadMesh()

    return () => {
      if (rootMesh) rootMesh.dispose()
    }
  }, [scene, shadowGenerator, item.id]) // Intentionally not depending on item.position so it doesn't re-render/reload on drag

  return null
}

export default Furniture3D
