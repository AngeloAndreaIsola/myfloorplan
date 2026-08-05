import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stage, 
  ContactShadows, 
  Html
} from '@react-three/drei';
import { 
  ChevronLeft as ChevronLeftIcon, 
  Save as SaveIcon, 
  Maximize2 as Maximize2Icon, 
  RotateCcw as RotateCcwIcon, 
  Palette as PaletteIcon, 
  Layers as LayersIcon, 
  Ruler as RulerIcon,
  Info as InfoIcon,
  Plus as PlusIcon
} from 'lucide-react';
import { Asset, FloorplanItem } from '@myfloorplan/shared';

// Placeholder for 3D Model logic
const ModelPreview = ({ color, scale }: { color: string, scale: [number, number, number] }) => {
  return (
    <mesh scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

interface ItemFactoryProps {
  asset: Partial<Asset>;
  onBack: () => void;
}

export const ItemFactory: React.FC<ItemFactoryProps> = ({ asset, onBack }) => {
  const [color, setColor] = useState('#3b82f6');
  const [dimensions, setDimensions] = useState({ width: 100, height: 210, depth: 80 });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onBack();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-base-300">
      {/* Header */}
      <div className="bg-base-100 px-6 py-4 border-b border-base-200 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn btn-ghost btn-sm btn-circle">
            <ChevronLeftIcon size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Create Floorplan Item</h1>
            <p className="text-xs opacity-50 flex items-center gap-1">
              Source Asset: <span className="text-primary font-medium">{asset.name}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm gap-2">
            <RotateCcwIcon size={16} /> Reset
          </button>
          <button 
            className={`btn btn-primary btn-sm gap-2 ${isSaving ? 'loading' : ''}`}
            onClick={handleSave}
          >
            {!isSaving && <SaveIcon size={16} />}
            {isSaving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Sidebar */}
        <div className="w-80 bg-base-200 border-r border-base-300 p-6 space-y-8 overflow-y-auto custom-scrollbar shadow-xl z-10">
          {/* Metadata Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              <InfoIcon size={16} className="text-primary" />
              Basic Info
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs">Item Name</span>
              </label>
              <input type="text" defaultValue={asset.name} className="input input-bordered input-sm bg-base-100" />
            </div>
          </section>

          {/* Customization Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              <PaletteIcon size={16} className="text-secondary" />
              Appearance
            </div>
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs">Primary Color</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#ffffff', '#000000'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform active:scale-95 ${color === c ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Dynamic Resizing Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              <RulerIcon size={16} className="text-accent" />
              Dimensions (cm)
            </div>
            <div className="space-y-3">
              {['Width', 'Height', 'Depth'].map(dim => (
                <div key={dim} className="space-y-1">
                  <div className="flex justify-between text-[10px] opacity-70">
                    <span>{dim}</span>
                    <span>{(dimensions as any)[dim.toLowerCase()]} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    value={(dimensions as any)[dim.toLowerCase()]} 
                    onChange={(e) => setDimensions({...dimensions, [dim.toLowerCase()]: parseInt(e.target.value)})}
                    className="range range-xs range-primary" 
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Tags Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              <LayersIcon size={16} className="text-info" />
              Metadata Tags
            </div>
            <div className="flex flex-wrap gap-1">
              <div className="badge badge-primary badge-outline gap-1 text-[10px] py-2 px-3">
                Modern <button className="hover:text-error">×</button>
              </div>
              <button className="btn btn-xs btn-ghost gap-1 opacity-50 hover:opacity-100">
                <PlusIcon size={10} /> Add Tag
              </button>
            </div>
          </section>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 bg-[#1a1a1a] relative">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="badge badge-neutral shadow-xl p-3 gap-2 backdrop-blur-md bg-black/30 border-white/10 uppercase tracking-widest text-[10px]">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              3D Real-time Preview
            </div>
          </div>
          
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 35 }}>
            <Suspense fallback={<Html center><span className="loading loading-spinner loading-lg"></span></Html>}>
              <Stage environment="city" adjustCamera intensity={0.8}>
                <ModelPreview 
                  color={color} 
                  scale={[dimensions.width/100, dimensions.height/100, dimensions.depth/100]} 
                />
              </Stage>
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
              <ContactShadows opacity={0.4} scale={10} blur={2} far={10} resolution={256} color="#000000" />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
};
