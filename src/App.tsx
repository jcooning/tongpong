import { useState } from 'react'
import RecordTab from './tabs/RecordTab'
import StatsTab from './tabs/StatsTab'
import SettingsTab from './tabs/SettingsTab'
import Tabbar from './components/Tabbar'
import './App.css'

export type Tab = 'record' | 'stats' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('record')

  return (
    <div className="app">
      <div className="content">
        {tab === 'record' && <RecordTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
      <Tabbar current={tab} onChange={setTab} />
    </div>
  )
}
