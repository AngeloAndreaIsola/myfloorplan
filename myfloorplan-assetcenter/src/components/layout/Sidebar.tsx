import React from 'react';
import { 
  LayoutDashboard as LayoutDashboardIcon, 
  Package as PackageIcon, 
  ShoppingBag as ShoppingBagIcon, 
  Activity as ActivityIcon, 
  Globe as GlobeIcon, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'assets', label: 'Assets', icon: PackageIcon },
    { id: 'items', label: 'Floorplan Items', icon: ShoppingBagIcon },
    { id: 'jobs', label: 'Asset Jobs', icon: ActivityIcon },
    { id: 'sources', label: 'Sources', icon: GlobeIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-base-300 flex flex-col shadow-2xl z-10 border-r border-base-200">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <PackageIcon className="text-primary-content" size={20} />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase">Asset Center</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1 custom-scrollbar overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 font-bold scale-[1.02]' 
                : 'hover:bg-base-200 opacity-70 hover:opacity-100'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-base-200/50">
        <div className="flex items-center gap-3 px-2">
          <div className="avatar online">
            <div className="w-10 h-10 rounded-xl ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold truncate">System Admin</p>
            <p className="text-[10px] opacity-50">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
