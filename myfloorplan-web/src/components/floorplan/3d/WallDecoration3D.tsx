import React, { useEffect } from 'react'
import { MeshBuilder, Vector3, StandardMaterial, Color3, Texture, PointerDragBehavior } from 'babylonjs'
import { WallDecorationItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface WallDecoration3DProps {
  item: WallDecorationItem
}

const WallDecoration3D: React.FC<WallDecoration3DProps> = ({ item }) => {
  const { scene, shadowGenerator } = useScene()
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem)

  useEffect(() => {
    if (!scene) return

    // Create a thin box to represent a painting, poster, mirror, or shelf
    const decor = MeshBuilder.CreateBox(`decor-${item.id}`, {
      width: item.dimensions?.width || 40,
      height: item.dimensions?.height || 60,
      depth: item.thickness || 2
    }, scene)

    // Position it
    // Note: A real app would snap this to a wall's normal and position.
    // For now, it behaves like a placed item floating at a specific height.
    decor.position = new Vector3(item.position.x, item.position.y || 100, item.position.z)
    decor.rotation.y = (item.rotation * Math.PI) / 180

    const mat = new StandardMaterial(`decorMat-${item.id}`, scene)
    mat.diffuseColor = Color3.FromHexString('#FFFFFF')
    if (item.imageUrl) {
      mat.diffuseTexture = new Texture(item.imageUrl, scene)
    }
    decor.material = mat

    decor.receiveShadows = true
    if (shadowGenerator) shadowGenerator.addShadowCaster(decor)

    // Add dragging for Y axis mostly (up/down the wall) and X/Z sliding
    const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 0, 1) }) // Drag on camera plane roughly
    decor.addBehavior(dragBehavior)
    
    dragBehavior.onDragEndObservable.add(() => {
      updatePlacedItem(item.id, {
        position: { 
          x: decor.position.x, 
          y: decor.position.y, 
          z: decor.position.z 
        }
      })
    })

    return () => {
      decor.dispose()
      mat.dispose()
    }
  }, [scene, shadowGenerator, item])

  return null
}

export default WallDecoration3D
