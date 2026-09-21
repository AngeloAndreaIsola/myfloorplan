import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { furnitureCatalog, loadCatalog, type FurnitureAsset } from '../../furniture';

interface FurniturePlacerProps {
  onPlace: (asset: FurnitureAsset, position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }) => void;
  onClose: () => void;
}

const FurniturePlacer: React.FC<FurniturePlacerProps> = ({ onPlace, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<FurnitureAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const tempGroupRef = useRef<THREE.Group | null>(null);
  const [catalog, setCatalog] = useState<FurnitureAsset[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Load catalog on mount
  useEffect(() => {
    loadCatalog().then((items) => {
      setCatalog(items);
      setCategories(['All', ...Array.from(new Set(items.map((a) => a.category))).sort()]);
      setCatalogLoaded(true);
    });
  }, []);

  // Initialize Three.js scene for the preview panel
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);
    camera.position.set(1500, 1000, 1500);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 200;
    controls.maxDistance = 5000;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(1000, 2000, 1000);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(3000, 20, 0x444466, 0x333355);
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(3000, 3000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (containerRef.current && rendererRef.current && cameraRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        rendererRef.current.setSize(w, h);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, []);

  // Render catalog item as a mesh in the preview
  useEffect(() => {
    if (!sceneRef.current || !selectedAsset) return;

    const loader = new GLTFLoader();
    loader.load(
      selectedAsset.model,
      (gltf: any) => {
        const model = gltf.scene as THREE.Group;

        if (tempGroupRef.current) {
          sceneRef.current?.remove(tempGroupRef.current);
          tempGroupRef.current.traverse((child: any) => {
            if (child.isMesh) {
              child.geometry?.dispose();
              child.material?.dispose();
            }
          });
        }

        const group = new THREE.Group();
        model.traverse((child: any) => {
          if (child.isMesh) {
            const clone = child.clone();
            clone.castShadow = true;
            clone.receiveShadow = true;
            group.add(clone);
          }
        });

        group.position.y = 0;
        tempGroupRef.current = group;
        sceneRef.current.add(group);

        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const dist = maxDim * 3;
          cameraRef.current?.position.set(dist * 0.5, dist * 0.4, dist * 0.5);
          controlsRef.current?.target.set(0, size.y / 2, 0);
          controlsRef.current?.update();
        }
      },
      undefined,
      (err: any) => {
        console.error('Failed to load preview:', err);
      }
    );
  }, [selectedAsset]);

  // Handle click on preview to place
  useEffect(() => {
    if (!sceneRef.current || !selectedAsset || !rendererRef.current) return;

    const canvas = rendererRef.current.domElement;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, cameraRef.current!);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersection);

      if (intersection) {
        onPlace(
          selectedAsset,
          { x: Math.round(intersection.x), y: 0, z: Math.round(intersection.z) },
          { x: 0, y: 0, z: 0 }
        );
        if (tempGroupRef.current && sceneRef.current) {
          sceneRef.current.remove(tempGroupRef.current);
          tempGroupRef.current.traverse((child: any) => {
            if (child.isMesh) {
              child.geometry?.dispose();
              child.material?.dispose();
            }
          });
          tempGroupRef.current = null;
        }
        setSelectedAsset(null);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [selectedAsset, onPlace]);

  const filteredAssets = catalog
    .filter((a: FurnitureAsset) => {
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !a.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
      return true;
    })
    .slice(0, 50);

  return (
    <div className="absolute inset-0 bg-base-300 z-30 flex flex-col">
      {/* Header */}
      <div className="bg-base-100 px-4 py-3 flex items-center justify-between border-b border-base-300 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider opacity-70">Place Furniture</h2>
          {catalogLoaded && <span className="text-xs opacity-50">({catalog.length} items)</span>}
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Search + filters */}
      <div className="px-4 py-2 bg-base-200/50 flex gap-2 items-center flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search furniture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered input-sm w-full bg-base-100"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto flex-shrink-0">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-xs flex-shrink-0 ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {!catalogLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-neutral-500 text-sm">Loading catalog...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAssets.map((asset: FurnitureAsset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`card bg-base-200 hover:shadow-xl transition-all cursor-pointer text-left ${
                  selectedAsset?.id === asset.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <figure className="aspect-square bg-neutral-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-neutral-500 text-4xl font-bold">
                      {asset.widthMm > 0 ? `${Math.round(asset.widthMm/10)}×${Math.round(asset.depthMm/10)}` : 'GLB'}
                    </div>
                  </div>
                  <span className="absolute top-1 right-1 badge badge-sm badge-ghost">GLB</span>
                </figure>
                <div className="p-2">
                  <h3 className="font-bold text-xs truncate">{asset.name}</h3>
                  <p className="text-[10px] opacity-50">{asset.manufacturer}</p>
                  {asset.widthMm > 0 && (
                    <p className="text-[10px] opacity-30 mt-0.5">
                      {Math.round(asset.widthMm/10)}×{Math.round(asset.depthMm/10)}×{Math.round(asset.heightMm/10)} cm
                    </p>
                  )}
                </div>
              </button>
            ))}
            {filteredAssets.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <p>No furniture items found.</p>
                <p className="text-xs mt-1">Add GLB files to /public/assets/furniture/ and rebuild.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-base-100/80 backdrop-blur px-4 py-2 text-center text-xs text-neutral-500 border-t border-base-300 flex-shrink-0">
        Click a furniture item to preview, then click on the ground plane to place it
      </div>
    </div>
  );
};

export default FurniturePlacer;
