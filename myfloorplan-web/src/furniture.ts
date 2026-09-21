import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface FurnitureAsset {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  model: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

const _cache: Record<string, { status: 'loading' | 'loaded' | 'error'; model: THREE.Group | null; error: string | null }> = {};
const _loader = new GLTFLoader();

export function loadModel(asset: FurnitureAsset): Promise<THREE.Group | null> {
  if (_cache[asset.id]?.status === 'loaded' && _cache[asset.id].model) {
    return Promise.resolve(_cache[asset.id].model.clone(true));
  }
  if (_cache[asset.id]?.status === 'loading') {
    return new Promise((resolve) => {
      const check = () => {
        if (_cache[asset.id]?.status === 'loaded' && _cache[asset.id].model) {
          resolve(_cache[asset.id].model.clone(true));
        } else if (_cache[asset.id]?.status === 'error') {
          resolve(null);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  _cache[asset.id] = { status: 'loading', model: null, error: null };

  return new Promise((resolve) => {
    _loader.load(
      asset.model,
      (gltf: any) => {
        const model = gltf.scene as THREE.Group;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y -= box.min.y;
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        model.updateMatrixWorld(true);
        _cache[asset.id] = { status: 'loaded', model, error: null };
        resolve(model.clone(true));
      },
      undefined,
      (err: any) => {
        console.error(`[Furniture] Failed to load ${asset.name}:`, err);
        _cache[asset.id] = { status: 'error', model: null, error: String(err) };
        resolve(null);
      }
    );
  });
}

let _catalogPromise: Promise<FurnitureAsset[]> | null = null;
export const furnitureCatalog: FurnitureAsset[] = [];

export async function loadCatalog(): Promise<FurnitureAsset[]> {
  if (_catalogPromise) return _catalogPromise;
  _catalogPromise = (async () => {
    try {
      const res = await fetch('/furniture.json');
      if (!res.ok) throw new Error('Failed to load furniture catalog');
      const data = await res.json();
      const assets: FurnitureAsset[] = data.assets.filter((a: any) => a.enabled !== false);
      furnitureCatalog.push(...assets);
      return assets;
    } catch (e) {
      console.error('[furniture] Catalog load failed:', e);
      return [];
    }
  })();
  return _catalogPromise;
}
