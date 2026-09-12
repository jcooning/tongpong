import type { Tab } from '../App'
import './Tabbar.css'

const IconRecord = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
)

const IconStats = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M5 19V11M12 19V5M19 19v-6" />
  </svg>
)

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
  </svg>
)

interface Props {
  current: Tab
  onChange: (tab: Tab) => void
}

export default function Tabbar({ current, onChange }: Props) {
  return (
    <div className="tabbar">
      <button className={`tab ${current === 'record' ? 'on' : ''}`} onClick={() => onChange('record')}>
        <IconRecord />기록
      </button>
      <button className={`tab ${current === 'stats' ? 'on' : ''}`} onClick={() => onChange('stats')}>
        <IconStats />통계
      </button>
      <button className={`tab ${current === 'settings' ? 'on' : ''}`} onClick={() => onChange('settings')}>
        <IconSettings />설정
      </button>
    </div>
  )
}
