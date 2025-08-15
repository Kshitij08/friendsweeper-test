'use client'

import { useState } from 'react'
import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import CustomOGImageAction from './CustomOGImageAction'
import { Haptics } from './Haptics'

type TabType = 'user' | 'actions' | 'wallet' | 'notifications' | 'custom-image' | 'haptics'

const tabs = [
  { id: 'user' as TabType, label: 'User Info', icon: '👤' },
  { id: 'actions' as TabType, label: 'Farcaster Actions', icon: '⚡' },
  { id: 'wallet' as TabType, label: 'Wallet', icon: '💰' },
  { id: 'notifications' as TabType, label: 'Notifications', icon: '🔔' },
  { id: 'custom-image' as TabType, label: 'Custom Image', icon: '🖼️' },
  { id: 'haptics' as TabType, label: 'Haptics', icon: '📳' },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('user')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user':
        return <User />
      case 'actions':
        return <FarcasterActions />
      case 'wallet':
        return <WalletActions />
      case 'notifications':
        return <NotificationActions />
      case 'custom-image':
        return <CustomOGImageAction />
      case 'haptics':
        return <Haptics />
      default:
        return <User />
    }
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#333] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'bg-transparent text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  )
}
