import { type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="ui-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`ui-tab ${activeTab === tab.id ? 'ui-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="ui-tab__icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
