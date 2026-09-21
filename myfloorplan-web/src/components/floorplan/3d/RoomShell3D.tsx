import React, { useEffect, useRef } from 'react'
import { SceneLoader, Vector3, Mesh, StandardMaterial, Color3, PBRMaterial, Scene } from 'babylonjs'
import 'babylonjs-loaders'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

// RoomShell3D — loads claude2.glb and displays it as a ghost overlay
// Also extracts wall geometry to inform the wall system
interface RoomShell3DProps {
  glbPath?: string
  opacity?: number
  color?: string
  scale?: number
  visible?: boolean
}

const RoomShell3D: React.FC<RoomShell3DProps> = ({
  glbPath = '/assets/room/claude2.glb',
  opacity = 0.08,
  color = '#94A3B8',
  scale = 100,
  visible = true,
}) => {
  const { scene } = useScene()
  const renderSettings = useEditorStore((state) => state.renderSettings)
  const shellRef = useRef<Mesh | null>(null)
  const wallMeshesRef = useRef<Mesh[]>([])
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!scene || loadedRef.current) return

    SceneLoader.ImportMeshAsync('', glbPath, scene).then((result) => {
      if (!result || result.meshes.length === 0) {
        console.warn('[RoomShell3D] No meshes in claude2.glb')
        return
      }

      const rootMesh = result.meshes[0]
      const bbox = rootMesh.getBoundingInfo()

      console.log('[RoomShell3D] claude2.glb loaded:', {
        bbox: {
          min: { x: bbox.minimum.x, y: bbox.minimum.y, z: bbox.minimum.z },
          max: { x: bbox.maximum.x, y: bbox.maximum.y, z: bbox.maximum.z },
        },
        meshCount: result.meshes.length,
      })

      // GLB is in meters, floor plan is in cm → scale 100
      const unitScale = scale

      // Create a semi-transparent ghost mesh for visual reference
      const ghostColor = Color3.FromHexString(color)

      result.meshes.forEach((mesh) => {
        if (mesh === rootMesh) return // skip the root node, wrap children only

        const m = mesh as Mesh
        const ghostGroup = new Mesh('roomShellGhost', scene)
        ghostGroup.setEnabled(false)

        mesh.setParent(ghostGroup)
        mesh.scaling = new Vector3(unitScale, unitScale, unitScale)

        const mat = new StandardMaterial('roomShellGhostMat', scene)
        mat.diffuseColor = ghostColor
        mat.alpha = opacity
        mat.backFaceCulling = false
        mesh.material = mat

        // Only show if visible prop is true
        ghostGroup.setEnabled(visible)

        ghostGroup.position = new Vector3(0, 0, 0)
        shellRef.current = ghostGroup

        console.log('[RoomShell3D] Ghost overlay at scale', unitScale)
      })

      // Extract wall planes from the mesh bounding box and create Babylon wall meshes
      const rootMeshCast = rootMesh as Mesh
      const vertices = extractRoomVertices(rootMeshCast)
      if (vertices) {
        createWallMeshesFromVertices(scene, vertices, unitScale, renderSettings, opacity, color)
      }

      loadedRef.current = true
    }).catch((err) => {
      console.error('[RoomShell3D] Failed to load claude2.glb:', err)
    })

    return () => {
      if (shellRef.current) {
        shellRef.current.dispose()
        shellRef.current = null
      }
      wallMeshesRef.current.forEach((m) => m.dispose())
      wallMeshesRef.current = []
      loadedRef.current = false
    }
  }, [scene, renderSettings, glbPath, opacity, color, scale, visible])

  return null
}

/**
 * Extract the 6 bounding planes (floor, ceiling, 4 walls) from a room shell mesh.
 * Returns axis-aligned plane definitions in native GLB units (meters).
 */
function extractRoomVertices(mesh: Mesh): { walls: any[]; floor: any; ceiling: any } | null {
  const bbox = mesh.getBoundingInfo()
  const min = bbox.minimum
  const max = bbox.maximum

  const w = max.x - min.x
  const h = max.y - min.y
  const d = max.z - min.z

  console.log('[RoomShell3D] Extracted room bounds (meters):', {
    width: w, height: h, depth: d,
    min: { x: min.x, y: min.y, z: min.z },
    max: { x: max.x, y: max.y, z: max.z },
  })

  const walls = [
    // Back wall (Z-)
    { normal: new Vector3(0, 0, -1), center: new Vector3(0, h / 2, min.z), size: new Vector3(w, h, 0.1) },
    // Front wall (Z+)
    { normal: new Vector3(0, 0, 1), center: new Vector3(0, h / 2, max.z), size: new Vector3(w, h, 0.1) },
    // Left wall (X-)
    { normal: new Vector3(-1, 0, 0), center: new Vector3(min.x, h / 2, 0), size: new Vector3(0.1, h, d) },
    // Right wall (X+)
    { normal: new Vector3(1, 0, 0), center: new Vector3(max.x, h / 2, 0), size: new Vector3(0.1, h, d) },
  ]

  const floor = { center: new Vector3(0, 0, 0), size: new Vector3(w, d, 0.1), normal: new Vector3(0, 1, 0) }
  const ceiling = { center: new Vector3(0, h, 0), size: new Vector3(w, d, 0.1), normal: new Vector3(0, -1, 0) }

  return { walls, floor, ceiling }
}

/**
 * Create Babylon wall meshes from extracted room geometry.
 */
function createWallMeshesFromVertices(
  scene: Scene,
  vertices: { walls: any[]; floor: any; ceiling: any } | null,
  scale: number,
  renderSettings: { pbr?: boolean } | undefined,
  opacity: number,
  color: string
) {
  if (!vertices) return

  const wallMat = renderSettings?.pbr
    ? new PBRMaterial('roomShellWallPBR', scene)
    : new StandardMaterial('roomShellWallMat', scene)

  const c = Color3.FromHexString(color)
  if (renderSettings?.pbr) {
    wallMat.albedoColor = c
    wallMat.metallic = 0.05
    wallMat.roughness = 0.7
  } else {
    wallMat.diffuseColor = c
    wallMat.specularColor = new Color3(0, 0, 0)
  }
  wallMat.alpha = opacity
  wallMat.backFaceCulling = false

  const meshes: Mesh[] = []

  vertices.walls.forEach((wall, i) => {
    const w = wall.size.x * scale
    const h = wall.size.y * scale
    const d = wall.size.z * scale

    const mesh = Mesh.CreateBox(`wall-claude-${i}`, { width: w, height: h, depth: d }, scene)

    mesh.position = new Vector3(
      wall.center.x * scale,
      wall.center.y * scale,
      wall.center.z * scale
    )

    const normal = wall.normal
    if (Math.abs(normal.x) > 0.9) {
      mesh.rotation.y = normal.x > 0 ? Math.PI / 2 : -Math.PI / 2
    } else if (Math.abs(normal.z) > 0.9) {
      mesh.rotation.y = normal.z > 0 ? 0 : Math.PI
    }

    mesh.material = wallMat
    mesh.receiveShadows = true
    meshes.push(mesh)
  })

  wallMeshesRef.current = meshes
  console.log('[RoomShell3D] Created', meshes.length, 'wall meshes from claude2.glb geometry')
}

export default RoomShell3D
