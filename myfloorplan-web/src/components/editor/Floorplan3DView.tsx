import React, { useEffect, useRef } from 'react'
import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  Vector3, 
  HemisphericLight, 
  MeshBuilder, 
  StandardMaterial, 
  PBRMaterial,
  Color3,
  Color4,
  SceneLoader,
  CSG,
  DirectionalLight,
  ShadowGenerator,
  DefaultRenderingPipeline,
  Texture
} from 'babylonjs'
import 'babylonjs-loaders'
import earcut from 'earcut'
import { useEditorStore } from '../../store/useEditorStore'
import { Sun, Moon, Box, Layers, Zap } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

const Floorplan3DView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { wallLines, placedItems, rooms, renderSettings, setRenderSettings } = useEditorStore(useShallow(state => ({
    wallLines: state.wallLines,
    placedItems: state.placedItems,
    rooms: state.rooms,
    renderSettings: state.renderSettings,
    setRenderSettings: state.setRenderSettings
  })))
  const sceneRef = useRef<Scene | null>(null)
  const sunLightRef = useRef<DirectionalLight | null>(null)
  const shadowGeneratorRef = useRef<ShadowGenerator | null>(null)
  const engineRef = useRef<Engine | null>(null)
  const wallsGroupRef = useRef<any[]>([])
  const itemsGroupRef = useRef<any[]>([])
  const roomsGroupRef = useRef<any[]>([])

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new Engine(canvasRef.current, true)
    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.05, 0.05, 0.07, 1) 
    sceneRef.current = scene

    // Camera
    const camera = new ArcRotateCamera(
      'camera', 
      -Math.PI / 1.5, 
      Math.PI / 4, 
      1200, 
      new Vector3(500, 0, 500), 
      scene
    )
    camera.attachControl(canvasRef.current, true, false)
    camera.wheelPrecision = 0.5
    camera.maxZ = 10000

    // Ambient Lighting
    const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene)
    ambientLight.intensity = 0.6
    ambientLight.diffuse = new Color3(1, 1, 1)
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.3)

    // Post-processing
    const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [camera])
    pipeline.bloomEnabled = true
    pipeline.bloomThreshold = 0.9
    pipeline.bloomWeight = 0.2
    pipeline.fxaaEnabled = true
    pipeline.samples = 4

    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 5000, height: 5000 }, scene)
    const groundMat = new StandardMaterial('groundMat', scene)
    groundMat.diffuseColor = new Color3(0.1, 0.1, 0.12)
    groundMat.specularColor = new Color3(0, 0, 0)
    ground.material = groundMat
    ground.receiveShadows = true

    engineRef.current = engine

    engine.runRenderLoop(() => {
      scene.render()
    })

    const obs = new ResizeObserver(() => engine.resize())
    if (containerRef.current) obs.observe(containerRef.current)

    return () => {
      obs.disconnect()
      engine.dispose()
    }
  }, [])

  // Handle Render Settings (Sunlight & Shadows)
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Manage Sunlight
    if (renderSettings.sunlight) {
      if (!sunLightRef.current) {
        const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), scene)
        sun.position = new Vector3(1000, 1500, 1000)
        sun.intensity = 1.0
        sunLightRef.current = sun
      }
    } else {
      if (sunLightRef.current) {
        sunLightRef.current.dispose()
        sunLightRef.current = null
      }
    }

    // Manage Shadows
    if (renderSettings.shadows && sunLightRef.current) {
      if (!shadowGeneratorRef.current) {
        const shadows = new ShadowGenerator(1024, sunLightRef.current)
        shadows.useBlurExponentialShadowMap = true
        shadows.blurKernel = 32
        shadows.setDarkness(0.5)
        shadowGeneratorRef.current = shadows
        
        // Add existing meshes to shadow caster
        wallsGroupRef.current.forEach(m => shadows.addShadowCaster(m))
        itemsGroupRef.current.forEach(root => root.getChildMeshes().forEach((m: any) => shadows.addShadowCaster(m)))
      }
    } else {
      if (shadowGeneratorRef.current) {
        shadowGeneratorRef.current.dispose()
        shadowGeneratorRef.current = null
      }
    }
  }, [renderSettings.sunlight, renderSettings.shadows])

  // Sync scene (Walls, Rooms, Items)
  useEffect(() => {
    const scene = sceneRef.current
    const shadowGenerator = shadowGeneratorRef.current
    if (!scene) return

    const createMaterial = (name: string, colorHex: string, textureUrl?: string) => {
      if (renderSettings.pbr) {
        const pbr = new PBRMaterial(name, scene)
        pbr.albedoColor = Color3.FromHexString(colorHex)
        pbr.metallic = 0.1
        pbr.roughness = 0.6
        if (textureUrl) pbr.albedoTexture = new Texture(textureUrl, scene)
        return pbr
      } else {
        const std = new StandardMaterial(name, scene)
        std.diffuseColor = Color3.FromHexString(colorHex)
        std.specularColor = new Color3(0, 0, 0)
        if (textureUrl) std.diffuseTexture = new Texture(textureUrl, scene)
        return std
      }
    }

    // 1. SYNC WALLS
    wallsGroupRef.current.forEach(m => m.dispose())
    wallsGroupRef.current = []
    
    wallLines.forEach((wall) => {
      const [x1, y1, x2, y2] = wall.points
      const dx = x2 - x1
      const dy = y2 - y1
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)

      const mat = createMaterial(`wallMat-${wall.id}`, wall.color || '#CBD5E1', wall.textureUrl)
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

      const openings = wall.openings || []
      if (openings.length > 0) {
        let wallCSG = CSG.FromMesh(baseWall)
        openings.forEach(op => {
          const cutterHeight = op.type === 'Window' ? 60 : 120
          const cutterY = op.type === 'Window' ? 80 : 60
          const cutter = MeshBuilder.CreateBox(`cutter-${op.id}`, {
            width: op.width, height: cutterHeight, depth: (wall.thickness || 12) + 20
          }, scene)
          cutter.position = new Vector3(x1 + dx * op.offset, cutterY, y1 + dy * op.offset)
          cutter.rotation.y = -angle
          wallCSG = wallCSG.subtract(CSG.FromMesh(cutter))
          cutter.dispose()
        })
        const finalWall = wallCSG.toMesh(`wall-${wall.id}`, mat, scene, true)
        baseWall.dispose()
        finalWall.receiveShadows = true
        if (shadowGenerator) shadowGenerator.addShadowCaster(finalWall)
        wallsGroupRef.current.push(finalWall)
      } else {
        baseWall.material = mat
        baseWall.receiveShadows = true
        if (shadowGenerator) shadowGenerator.addShadowCaster(baseWall)
        wallsGroupRef.current.push(baseWall)
      }
    })

    // 2. SYNC ROOMS (FLOORS)
    roomsGroupRef.current.forEach(m => m.dispose())
    roomsGroupRef.current = []

    rooms.forEach(room => {
      const shape = []
      for (let i = 0; i < room.points.length; i += 2) {
        shape.push(new Vector3(room.points[i], 0, room.points[i+1]))
      }
      try {
        const floor = MeshBuilder.ExtrudePolygon(`room-${room.id}`, { shape, depth: 4, sideOrientation: 2 }, scene, earcut)
        floor.position.y = 2
        const mat = createMaterial(`floorMat-${room.id}`, room.color || '#6366F1', room.textureUrl)
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
        roomsGroupRef.current.push(floor)
      } catch (e) {}
    })

    // 3. SYNC ITEMS
    itemsGroupRef.current.forEach(m => m.dispose())
    itemsGroupRef.current = []

    placedItems.forEach(async (item) => {
      if (item.modelUrl) {
        try {
          const result = await SceneLoader.ImportMeshAsync("", "", item.modelUrl, scene)
          const root = result.meshes[0]
          root.position = new Vector3(item.position.x, 2, item.position.z)
          root.rotationQuaternion = null
          root.rotation.y = (item.rotation * Math.PI) / 180
          root.scaling = new Vector3(item.scale * 100, item.scale * 100, item.scale * 100)
          
          root.getChildMeshes().forEach(m => {
            m.receiveShadows = true
            if (shadowGenerator) shadowGenerator.addShadowCaster(m)
          })
          itemsGroupRef.current.push(root)
        } catch (e) {
          const fallback = MeshBuilder.CreateBox(`fallback-${item.id}`, { size: 40 }, scene)
          fallback.position = new Vector3(item.position.x, 20, item.position.z)
          if (shadowGenerator) shadowGenerator.addShadowCaster(fallback)
          itemsGroupRef.current.push(fallback)
        }
      }
    })
  }, [wallLines, placedItems, rooms, renderSettings.pbr, shadowGeneratorRef.current])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block outline-none" />
      
      {/* Viewport Info */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-base-100/60 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/10">
          <p className="text-[10px] font-black uppercase opacity-50 tracking-tighter mb-1 select-none">3D Workspace</p>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold font-mono uppercase tracking-tight">Active</span>
             </div>
             <div className="w-px h-3 bg-white/10" />
             <p className="text-xs font-medium opacity-70">Orbit: Left Click | Zoom: Scroll</p>
          </div>
        </div>
      </div>

      {/* Render Options Floating Menu */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-base-100/60 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/5 flex flex-col gap-1">
          <RenderToggle 
            active={renderSettings.sunlight} 
            onClick={() => setRenderSettings({ sunlight: !renderSettings.sunlight })} 
            icon={<Sun className="w-3.5 h-3.5" />} 
            label="Sunlight" 
          />
          <RenderToggle 
            active={renderSettings.shadows} 
            disabled={!renderSettings.sunlight}
            onClick={() => setRenderSettings({ shadows: !renderSettings.shadows })} 
            icon={<Moon className="w-3.5 h-3.5" />} 
            label="Shadows" 
          />
          <div className="h-px bg-white/5 mx-2 my-0.5" />
          <RenderToggle 
            active={renderSettings.pbr} 
            onClick={() => setRenderSettings({ pbr: !renderSettings.pbr })} 
            icon={<Layers className="w-3.5 h-3.5" />} 
            label="PBR Materials" 
          />
        </div>
      </div>
    </div>
  )
}

const RenderToggle = ({ active, onClick, icon, label, disabled = false }: { active: boolean, onClick: () => void, icon: any, label: string, disabled?: boolean }) => (
  <div className="tooltip tooltip-left font-bold" data-tip={disabled ? `${label} (Requires Sunlight)` : label}>
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-square btn-sm rounded-xl transition-all duration-300 border-none ${
        active 
          ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 scale-105' 
          : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'
      } ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
    >
      {icon}
    </button>
  </div>
)

export default Floorplan3DView
