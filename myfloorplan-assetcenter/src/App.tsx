import React, { useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ManagementView } from './components/assets/ManagementView';
import { ItemFactory } from './components/editor/ItemFactory';
import { Asset } from '@myfloorplan/shared';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);

  if (editingAsset) {
    return <ItemFactory asset={editingAsset} onBack={() => setEditingAsset(null)} />;
  }

  return (
    <div className="flex h-screen bg-base-100 text-base-content overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-base-100 relative">
        <div className="sticky top-0 z-20 backdrop-blur-md bg-base-100/70 border-b border-base-200 px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium opacity-50 flex items-center gap-2 uppercase tracking-widest">
            {activeTab.replace('-', ' ')}
          </div>
          <div className="flex gap-2">
            <div className="indicator">
              <span className="indicator-item badge badge-primary badge-xs"></span> 
              <button className="btn btn-ghost btn-circle btn-sm">
                <ActivityIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'assets' && <ManagementView onEdit={(asset) => setEditingAsset(asset)} />}
          {activeTab === 'items' && <div className="p-6">Floorplan Items View - Coming Soon</div>}
          {activeTab === 'jobs' && <div className="p-6">Asset Jobs View - Coming Soon</div>}
          {activeTab === 'sources' && <div className="p-6">Sources View - Coming Soon</div>}
          {activeTab === 'settings' && <div className="p-6">Settings View - Coming Soon</div>}
        </div>
      </main>
    </div>
  );
};

export default App;
