import React, { useEffect, useRef } from 'react'
import {
  SceneLoader,
  Vector3,
  MeshBuilder,
  PointerDragBehavior,
  StandardMaterial,
  Color3,
  Mesh,
  PointerEventTypes
} from 'babylonjs'
import { ActionManager, ExecuteCodeAction } from 'babylonjs'
import { PlacedItem } from '../../../../myfloorplan-shared/src/types/interior'
import { useScene } from './SceneContext'
import { useEditorStore } from '../../../store/useEditorStore'

interface Furniture3DProps {
  item: PlacedItem
}

const Furniture3D: React.FC<Furniture3DProps> = ({ item }) => {
  const { scene, shadowGenerator } = useScene()
  const updatePlacedItem = useEditorStore(state => state.updatePlacedItem)
  const rootMeshRef = useRef<Mesh | null>(null)
  const rotationHandleRef = useRef<Mesh | null>(null)
  const isRotatingRef = useRef(false)
  const startRotationRef = useRef(0)
  const startHandleAngleRef = useRef(0)
  const moveObsRef = useRef<{ remove: () => void } | null>(null)
  const upObsRef = useRef<{ remove: () => void } | null>(null)

  // --- Keyboard rotation (arrow keys) ---
  useEffect(() => {
    if (!scene) return

    // We track keyboard rotation in a ref so we can check if our item is selected
    const editorStore = useEditorStore.getState()
    const selectedId = editorStore.selectedElement?.id

    if (selectedId !== item.id) return

    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key !== 'ArrowLeft' && evt.key !== 'ArrowRight') return
      const rootMesh = rootMeshRef.current
      if (!rootMesh) return
      evt.preventDefault()
      const step = evt.shiftKey ? 15 : 5
      const delta = evt.key === 'ArrowRight' ? step : -step
      const newRot = rootMesh.rotation.y + (delta * Math.PI / 180)
      rootMesh.rotation.y = newRot

      if (rotationHandleRef.current) {
        const r = 7
        const handleY = 2 + 50
        rotationHandleRef.current.position.x = rootMesh.position.x + Math.sin(newRot) * r
        rotationHandleRef.current.position.z = rootMesh.position.z + Math.cos(newRot) * r
        rotationHandleRef.current.position.y = handleY
      }

      updatePlacedItem(item.id, { rotation: Math.round(newRot * (180 / Math.PI)) })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [scene, item.id, updatePlacedItem])

  // --- Build mesh ---
  useEffect(() => {
    if (!scene) return

    let rootMesh: Mesh | null = null
    let rotationHandle: Mesh | null = null

    const loadMesh = async () => {
      if (item.modelUrl) {
        try {
          const r2PublicDomain = 'https://pub-0aad5cebf0744360b97f9343ac54fa55.r2.dev'
          const fullUrl = item.modelUrl.startsWith('/')
            ? `${r2PublicDomain}${item.modelUrl}`
            : item.modelUrl
          const result = await SceneLoader.ImportMeshAsync('', '', fullUrl, scene)
          if (result?.meshes?.[0]) {
            rootMesh = result.meshes[0] as Mesh
          }
        } catch {
          rootMesh = MeshBuilder.CreateBox(`fallback-${item.id}`, { size: 40 }, scene)
        }
      } else {
        rootMesh = MeshBuilder.CreateBox(`fallback-${item.id}`, { size: 40 }, scene)
      }

      if (!rootMesh) return

      rootMesh.position = new Vector3(item.position.x, 2, item.position.z)
      rootMesh.rotationQuaternion = null
      rootMesh.rotation.y = (item.rotation * Math.PI) / 180

      if (item.modelUrl && rootMesh.name !== `fallback-${item.id}`) {
        const sx = item.scale?.x || 1
        const sy = item.scale?.y || 1
        const sz = item.scale?.z || 1
        rootMesh.scaling = new Vector3(sx * 100, sz * 100, sy * 100)
      } else {
        const sx = item.scale?.x || 1
        const sy = item.scale?.y || 1
        const sz = item.scale?.z || 1
        rootMesh.scaling = new Vector3(sx, sz, sy)
      }

      rootMesh.getChildMeshes().forEach(m => {
        m.receiveShadows = true
        if (shadowGenerator) shadowGenerator.addShadowCaster(m)
      })

      rootMeshRef.current = rootMesh

      // --- Movement ---
      const existingDrag = rootMesh.getBehaviorByName('drag')
      if (existingDrag) rootMesh.removeBehavior(existingDrag)
      const dragBehavior = new PointerDragBehavior({ dragPlaneNormal: new Vector3(0, 1, 0) })
      rootMesh.addBehavior(dragBehavior)

      dragBehavior.onDragEndObservable.add(() => {
        if (!rootMesh) return
        updatePlacedItem(item.id, {
          position: {
            x: rootMesh.position.x,
            y: rootMesh.position.y,
            z: rootMesh.position.z
          }
        })
      })

      // --- Rotation handle ---
      const handleY = 2 + 50
      rotationHandle = MeshBuilder.CreateTorus(`rot-handle-${item.id}`, {
        diameter: 14,
        thickness: 3,
        tessellation: 16
      }, scene)
      const r = 7
      rotationHandle.position = new Vector3(
        rootMesh.position.x + Math.sin(rootMesh.rotation.y) * r,
        handleY,
        rootMesh.position.z + Math.cos(rootMesh.rotation.y) * r
      )
      rotationHandle.isPickable = true
      rotationHandle.rotation.x = Math.PI / 2

      const handleMat = new StandardMaterial(`handle-mat-${item.id}`, scene)
      handleMat.diffuseColor = new Color3(0.3, 0.5, 0.9)
      handleMat.alpha = 0.9
      rotationHandle.material = handleMat
      rotationHandleRef.current = rotationHandle

      // --- ActionManager: start rotation on pick ---
      rotationHandle.actionManager = new ActionManager(scene)
      rotationHandle.actionManager.registerAction(
        new ExecuteCodeAction({ trigger: ActionManager.OnPickTrigger }, () => {
          if (!rootMesh || !rotationHandle) return
          isRotatingRef.current = true
          startRotationRef.current = rootMesh.rotation.y
          const dx = rotationHandle.position.x - rootMesh.position.x
          const dz = rotationHandle.position.z - rootMesh.position.z
          startHandleAngleRef.current = Math.atan2(dz, dx)
        })
      )

      // --- Scene pointer move/up for live rotation ---
      const onPointerMove = (evt: { type: number }) => {
        if (evt.type !== PointerEventTypes.POINTERMOVE) return
        if (!isRotatingRef.current || !rootMesh || !rotationHandle) return
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY)
        if (!pickInfo?.hit || !pickInfo.pickedPoint) return

        const hit = pickInfo.pickedPoint
        const dx = hit.x - rootMesh.position.x
        const dz = hit.z - rootMesh.position.z
        if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return

        const currentAngle = Math.atan2(dz, dx)
        let delta = currentAngle - startHandleAngleRef.current
        if (delta > Math.PI) delta -= 2 * Math.PI
        if (delta < -Math.PI) delta += 2 * Math.PI

        const newRot = startRotationRef.current + delta
        rootMesh.rotation.y = newRot

        rotationHandle.position.x = rootMesh.position.x + Math.sin(newRot) * r
        rotationHandle.position.z = rootMesh.position.z + Math.cos(newRot) * r
        rotationHandle.position.y = handleY
      }

      const onPointerUp = () => {
        if (isRotatingRef.current && rootMesh) {
          updatePlacedItem(item.id, {
            rotation: Math.round(rootMesh.rotation.y * (180 / Math.PI))
          })
        }
        isRotatingRef.current = false
      }

      moveObsRef.current = scene.onPointerObservable.add(onPointerMove as any)
      upObsRef.current = scene.onPointerObservable.add(onPointerUp as any)

      return () => {
        if (moveObsRef.current) scene.onPointerObservable.remove(moveObsRef.current)
        if (upObsRef.current) scene.onPointerObservable.remove(upObsRef.current)
        if (rootMesh) rootMesh.dispose()
        if (rotationHandle) rotationHandle.dispose()
        rootMeshRef.current = null
        rotationHandleRef.current = null
      }
    }

    loadMesh()
  }, [scene, shadowGenerator, item.id])

  // Sync rotation from external changes (2D view or Properties panel)
  useEffect(() => {
    if (!rootMeshRef.current) return
    const rootMesh = rootMeshRef.current
    rootMesh.rotationQuaternion = null
    rootMesh.rotation.y = (item.rotation * Math.PI) / 180

    if (rotationHandleRef.current && rootMesh) {
      const r = 7
      const handleY = 2 + 50
      rotationHandleRef.current.position.x = rootMesh.position.x + Math.sin(rootMesh.rotation.y) * r
      rotationHandleRef.current.position.z = rootMesh.position.z + Math.cos(rootMesh.rotation.y) * r
      rotationHandleRef.current.position.y = handleY
    }
  }, [item.rotation])

  // Sync position from external changes
  useEffect(() => {
    if (!rootMeshRef.current) return
    const rootMesh = rootMeshRef.current
    rootMesh.position.x = item.position.x
    rootMesh.position.z = item.position.z

    if (rotationHandleRef.current && rootMesh) {
      const r = 7
      const handleY = 2 + 50
      rotationHandleRef.current.position.x = rootMesh.position.x + Math.sin(rootMesh.rotation.y) * r
      rotationHandleRef.current.position.z = rootMesh.position.z + Math.cos(rootMesh.rotation.y) * r
      rotationHandleRef.current.position.y = handleY
    }
  }, [item.position.x, item.position.z])

  return null
}

export default Furniture3D
