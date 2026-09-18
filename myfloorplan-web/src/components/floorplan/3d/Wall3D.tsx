import React, { useEffect } from 'react'
import { MeshBuilder, Vector3, StandardMaterial, PBRMaterial, Texture, Color3, CSG } from 'babylonjs'
import { WallLine } from '../../../../myfloorplan-shared/src/types/architecture'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface Wall3DProps {
  wall: WallLine
}

const Wall3D: React.FC<Wall3DProps> = ({ wall }) => {
  const { scene, shadowGenerator } = useScene()
  const renderSettings = useEditorStore(state => state.renderSettings)

  useEffect(() => {
    if (!scene) return

    const [x1, y1, x2, y2] = wall.points
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    let mat
    const matName = `wallMat-${wall.id}`
    const colorHex = wall.color || '#CBD5E1'
    
    if (renderSettings.pbr) {
      const pbr = new PBRMaterial(matName, scene)
      pbr.albedoColor = Color3.FromHexString(colorHex)
      pbr.metallic = 0.1
      pbr.roughness = 0.6
      if (renderSettings.wallTransparency) {
        pbr.alpha = 0.25
        pbr.backFaceCulling = false
      }
      if (wall.textureUrl) pbr.albedoTexture = new Texture(wall.textureUrl, scene)
      mat = pbr
    } else {
      const std = new StandardMaterial(matName, scene)
      std.diffuseColor = Color3.FromHexString(colorHex)
      std.specularColor = new Color3(0, 0, 0)
      if (renderSettings.wallTransparency) {
        std.alpha = 0.25
        std.backFaceCulling = false
      }
      if (wall.textureUrl) std.diffuseTexture = new Texture(wall.textureUrl, scene)
      mat = std
    }

    if (mat instanceof StandardMaterial && mat.diffuseTexture) {
      const tex = mat.diffuseTexture as Texture
      tex.uScale = distance / 100
      tex.vScale = 1.2
    } else if (mat instanceof PBRMaterial && mat.albedoTexture) {
      const tex = mat.albedoTexture as Texture
      tex.uScale = distance / 100
      tex.vScale = 1.2
    }

    const baseWall = MeshBuilder.CreateBox(`wall-base-${wall.id}`, { 
      width: distance, 
      height: 120, 
      depth: wall.thickness || 12 
    }, scene)
    baseWall.position = new Vector3(x1 + dx / 2, 60, y1 + dy / 2)
    baseWall.rotation.y = -angle

    const meshesToDispose: any[] = [mat]

    const openings = wall.openings || []
    if (openings.length > 0) {
      let wallCSG = CSG.FromMesh(baseWall)
      
      openings.forEach(op => {
        const isWindow = op.type === 'Window';
        const cutterHeight = isWindow ? 60 : 120;
        const cutterY = isWindow ? 80 : 60;
        const cutterWidth = op.dimensions?.width || (isWindow ? 60 : 80);
        
        const cutter = MeshBuilder.CreateBox(`cutter-${op.id}`, {
          width: cutterWidth, height: cutterHeight, depth: (wall.thickness || 12) + 20
        }, scene)
        cutter.position = new Vector3(x1 + dx * op.offset, cutterY, y1 + dy * op.offset)
        cutter.rotation.y = -angle
        
        wallCSG = wallCSG.subtract(CSG.FromMesh(cutter))

        const frameColor = op.styleId === 'wood' ? '#8B5A2B' : '#1E293B';
        let frameMat
        let glassMat
        
        if (renderSettings.pbr) {
          frameMat = new PBRMaterial(`frameMat-${op.id}`, scene)
          frameMat.albedoColor = Color3.FromHexString(frameColor)
          
          glassMat = new PBRMaterial(`glassMat-${op.id}`, scene)
          glassMat.albedoColor = Color3.FromHexString('#BAE6FD')
          glassMat.alpha = 0.4
          glassMat.metallic = 0.9
          glassMat.roughness = 0.05
        } else {
          frameMat = new StandardMaterial(`frameMat-${op.id}`, scene)
          frameMat.diffuseColor = Color3.FromHexString(frameColor)
          
          glassMat = new StandardMaterial(`glassMat-${op.id}`, scene)
          glassMat.diffuseColor = Color3.FromHexString('#BAE6FD')
          glassMat.alpha = 0.4
        }
        meshesToDispose.push(frameMat, glassMat)

        const frame = MeshBuilder.CreateBox(`frame-${op.id}`, {
           width: cutterWidth, height: cutterHeight, depth: (wall.thickness || 12) + 4
        }, scene);
        frame.position = new Vector3(x1 + dx * op.offset, cutterY, y1 + dy * op.offset);
        frame.rotation.y = -angle;

        const hole = MeshBuilder.CreateBox(`hole-${op.id}`, {
           width: cutterWidth - 8, height: cutterHeight - 8, depth: (wall.thickness || 12) + 10
        }, scene);
        hole.position = new Vector3(x1 + dx * op.offset, cutterY, y1 + dy * op.offset);
        hole.rotation.y = -angle;

        const frameCSG = CSG.FromMesh(frame).subtract(CSG.FromMesh(hole));
        const finalFrame = frameCSG.toMesh(`finalFrame-${op.id}`, frameMat, scene, true);
        meshesToDispose.push(finalFrame)
        
        if (isWindow || op.styleId === 'glass-door') {
           const glass = MeshBuilder.CreateBox(`glass-${op.id}`, {
              width: cutterWidth - 8, height: cutterHeight - 8, depth: 2
           }, scene);
           glass.position = new Vector3(x1 + dx * op.offset, cutterY, y1 + dy * op.offset);
           glass.rotation.y = -angle;
           glass.material = glassMat;
           meshesToDispose.push(glass)
        }

        frame.dispose();
        hole.dispose();
        cutter.dispose();
      })
      
      const finalWall = wallCSG.toMesh(`wall-${wall.id}`, mat, scene, true)
      baseWall.dispose()
      finalWall.receiveShadows = true
      if (shadowGenerator) shadowGenerator.addShadowCaster(finalWall)
      meshesToDispose.push(finalWall)
      
    } else {
      baseWall.material = mat
      baseWall.receiveShadows = true
      if (shadowGenerator) shadowGenerator.addShadowCaster(baseWall)
      meshesToDispose.push(baseWall)
    }

    return () => {
      meshesToDispose.forEach(m => m.dispose())
    }
  }, [scene, wall, renderSettings.pbr, renderSettings.wallTransparency, shadowGenerator])

  return null
}

export default Wall3D
