import React, { useState } from 'react';
import { 
  Search as SearchIcon, 
  Plus as PlusIcon, 
  Filter as FilterIcon,
  Grid as GridIcon,
  List as ListIcon
} from 'lucide-react';
import { Asset } from '@myfloorplan/shared';

interface ManagementViewProps {
  onEdit: (asset: Partial<Asset>) => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({ onEdit }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Management</h1>
        <button className="btn btn-primary">
          <PlusIcon size={20} />
          New Asset
        </button>
      </div>

      <div className="flex gap-4 items-center bg-base-200 p-4 rounded-xl shadow-inner">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={20} />
          <input type="text" placeholder="Search assets..." className="input input-bordered w-full pl-10 bg-base-100" />
        </div>
        <div className="join border border-base-300">
          <button 
            className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <GridIcon size={18} />
          </button>
          <button 
            className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <ListIcon size={18} />
          </button>
        </div>
        <button className="btn btn-sm btn-outline gap-2">
          <FilterIcon size={18} />
          Filters
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <div 
              key={i} 
              onClick={() => onEdit({ assetId: String(i), name: `French Window Model ${i}` })}
              className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
            >
              <figure className="aspect-square bg-neutral relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={`https://picsum.photos/seed/${i + 100}/200`} alt="Asset" className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 badge badge-ghost badge-sm opacity-70">GLB</span>
              </figure>
              <div className="p-3">
                <h3 className="font-bold text-xs truncate">French Window Model {i}</h3>
                <p className="text-[10px] opacity-50">SweetHome3D • 2.4 MB</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-200 rounded-xl shadow">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Source</th>
                <th>Type</th>
                <th>Size</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-10 h-10">
                          <img src={`https://picsum.photos/seed/${i + 200}/100`} />
                        </div>
                      </div>
                      <div className="font-bold">Eames Chair v{i}</div>
                    </div>
                  </td>
                  <td>SweetHome3D</td>
                  <td><span className="badge badge-sm badge-outline">Model</span></td>
                  <td>1.8 MB</td>
                  <td>2024-04-20</td>
                  <td>
                    <button 
                      className="btn btn-xs btn-ghost text-primary"
                      onClick={() => onEdit({ assetId: String(i), name: `Eames Chair v${i}` })}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
