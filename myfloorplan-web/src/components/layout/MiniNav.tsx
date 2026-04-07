import React from 'react'
import { 
  Home, 
  PenTool, 
  Package, 
  Compass, 
  Star, 
  Settings as SettingsIcon,
  Folder
} from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import { EditorTab } from '../../types'

const navItems: { name: EditorTab; icon: any }[] = [
  { name: 'Home', icon: Home },
  { name: 'Projects', icon: Folder },
  { name: 'Draw', icon: PenTool },
  { name: 'Items', icon: Package },
  { name: 'Settings', icon: SettingsIcon },
]

const MiniNav: React.FC = () => {
  const activeTab = useEditorStore((state) => state.activeTab)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)

  return (
    <div className="w-16 bg-base-200 flex flex-col items-center py-4 gap-4 border-r border-base-300 shrink-0">
      {navItems.map((item) => (
        <div key={item.name} className="tooltip tooltip-right" data-tip={item.name}>
          <button
            onClick={() => setActiveTab(item.name)}
            className={`btn btn-square btn-ghost btn-md transition-all duration-200 ${
              activeTab === item.name 
                ? 'bg-primary text-primary-content hover:bg-primary/90 shadow-md' 
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default MiniNav
