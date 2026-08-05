import React, { useEffect, useRef, useState } from 'react'
import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  Vector3, 
  HemisphericLight, 
  MeshBuilder, 
  StandardMaterial, 
  Color3,
  Color4,
  DirectionalLight,
  ShadowGenerator,
  DefaultRenderingPipeline
} from 'babylonjs'
import 'babylonjs-loaders'
import { useEditorStore } from '../../store/useEditorStore'
import { Sun as IconSun, Moon as IconMoon, Layers as IconLayers } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { SceneProvider } from '../floorplan/3d/SceneContext'
import Wall3D from '../floorplan/3d/Wall3D'
import Room3D from '../floorplan/3d/Room3D'
import Furniture3D from '../floorplan/3d/Furniture3D'
import Light3D from '../floorplan/3d/Light3D'
import Stair3D from '../floorplan/3d/Stair3D'
import WallDecoration3D from '../floorplan/3d/WallDecoration3D'

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
  
  const [sceneReady, setSceneReady] = useState(false)
  const sceneRef = useRef<Scene | null>(null)
  const sunLightRef = useRef<DirectionalLight | null>(null)
  const shadowGeneratorRef = useRef<ShadowGenerator | null>(null)
  const engineRef = useRef<Engine | null>(null)

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

    setSceneReady(true)

    return () => {
      obs.disconnect()
      engine.dispose()
      setSceneReady(false)
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
      }
    } else {
      if (shadowGeneratorRef.current) {
        shadowGeneratorRef.current.dispose()
        shadowGeneratorRef.current = null
      }
    }
  }, [renderSettings.sunlight, renderSettings.shadows, sceneReady])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block outline-none" />
      
      {sceneReady && (
        <SceneProvider scene={sceneRef.current} shadowGenerator={shadowGeneratorRef.current}>
          {wallLines.map(wall => <Wall3D key={wall.id} wall={wall} />)}
          {rooms.map(room => <Room3D key={room.id} room={room} />)}
          {placedItems.map((item) => {
            if ('wallOffset' in item) {
              return <WallDecoration3D key={item.id} item={item as any} />
            }
            if ('lightType' in item) {
              return <Light3D key={item.id} light={item as any} />
            }
            if (item.type === 'Stair') {
              return <Stair3D key={item.id} stair={item as any} />
            }
            return <Furniture3D key={item.id} item={item as any} />
          })}
        </SceneProvider>
      )}

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
            icon={<IconSun className="w-3.5 h-3.5" />} 
            label="Sunlight" 
          />
          <RenderToggle 
            active={renderSettings.shadows} 
            disabled={!renderSettings.sunlight}
            onClick={() => setRenderSettings({ shadows: !renderSettings.shadows })} 
            icon={<IconMoon className="w-3.5 h-3.5" />} 
            label="Shadows" 
          />
          <div className="h-px bg-white/5 mx-2 my-0.5" />
          <RenderToggle 
            active={renderSettings.pbr} 
            onClick={() => setRenderSettings({ pbr: !renderSettings.pbr })} 
            icon={<IconLayers className="w-3.5 h-3.5" />} 
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
