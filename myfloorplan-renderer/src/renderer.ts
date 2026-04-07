import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from 'babylonjs'

export const initRenderer = (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas, true)
  const scene = new Scene(engine)
  const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene)
  camera.attachControl(canvas, true)
  const light = new HemisphericLight('light', new Vector3(1, 1, 0), scene)
  const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 1 }, scene)

  engine.runRenderLoop(() => {
    scene.render()
  })

  return engine
}
