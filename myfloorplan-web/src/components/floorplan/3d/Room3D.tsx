import React, { useEffect } from 'react'
import { MeshBuilder, Vector3, StandardMaterial, PBRMaterial, Texture, Color3 } from 'babylonjs'
import earcut from 'earcut'
import { Room } from '../../../../myfloorplan-shared/src/types/architecture'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface Room3DProps {
  room: Room
}

const Room3D: React.FC<Room3DProps> = ({ room }) => {
  const { scene, shadowGenerator } = useScene()
  const renderSettings = useEditorStore(state => state.renderSettings)

  useEffect(() => {
    if (!scene) return

    const shape = []
    for (let i = 0; i < room.points.length; i += 2) {
      shape.push(new Vector3(room.points[i], 0, room.points[i+1]))
    }

    try {
      const floor = MeshBuilder.ExtrudePolygon(`room-${room.id}`, { shape, depth: 4, sideOrientation: 2 }, scene, earcut)
      floor.position.y = 2

      const matName = `floorMat-${room.id}`
      let mat
      if (renderSettings.pbr) {
        const pbr = new PBRMaterial(matName, scene)
        pbr.albedoColor = Color3.FromHexString(room.color || '#6366F1')
        pbr.metallic = 0.1
        pbr.roughness = 0.6
        if (room.textureUrl) pbr.albedoTexture = new Texture(room.textureUrl, scene)
        mat = pbr
      } else {
        const std = new StandardMaterial(matName, scene)
        std.diffuseColor = Color3.FromHexString(room.color || '#6366F1')
        std.specularColor = new Color3(0, 0, 0)
        if (room.textureUrl) std.diffuseTexture = new Texture(room.textureUrl, scene)
        mat = std
      }

      if (mat instanceof StandardMaterial && mat.diffuseTexture) {
        const tex = mat.diffuseTexture as Texture
        tex.uScale = 5
        tex.vScale = 5
      } else if (mat instanceof PBRMaterial && mat.albedoTexture) {
        const tex = mat.albedoTexture as Texture
        tex.uScale = 5
        tex.vScale = 5
      }

      floor.material = mat
      floor.receiveShadows = true

      return () => {
        floor.dispose()
        mat.dispose()
      }
    } catch (e) {
      console.warn("Failed to create room mesh:", e)
    }
  }, [scene, room, renderSettings.pbr])

  return null
}

export default Room3D
