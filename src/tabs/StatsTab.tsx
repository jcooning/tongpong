import { useState } from 'react'
import { loadEntries, upsertEntry, deleteEntry, formatDateLabel } from '../lib/storage'
import type { Entry } from '../lib/storage'
import './StatsTab.css'

type Period = '1w' | '1m' | '3m' | 'all'

const DOW_KR = ['일', '월', '화', '수', '목', '금', '토']

function formatEntryDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DOW_KR[d.getDay()]
  return `${m}월 ${day}일 ${dow}`
}

function movingAvg(arr: number[], window: number) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

interface ChartProps {
  values: number[]
  height: number
  pad: number
  showLabels: boolean
  id: string
}

function LineChart({ values, height, pad, showLabels, id }: ChartProps) {
  if (values.length < 2) return null
  const W = 358
  const T = pad
  const B = height - pad
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1

  const X = (i: number) => 4 + (i * (W - 8)) / (values.length - 1)
  const Y = (v: number) => B - ((v - lo) / span) * (B - T)

  const ma = movingAvg(values, 7)
  const maPath = ma.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const areaPath = maPath + ` L${X(values.length - 1).toFixed(1)} ${B} L4 ${B} Z`

  const dots = values.map((v, i) => (
    <circle key={i} cx={X(i).toFixed(1)} cy={Y(v).toFixed(1)} r="1.9" fill="var(--ink)" opacity=".18" />
  ))

  const lastIdx = values.length - 1
  const lastX = X(lastIdx)
  const lastY = Y(values[lastIdx])

  let labels = null
  if (showLabels) {
    const minIdx = values.indexOf(lo)
    labels = <>
      <text x={X(minIdx).toFixed(1)} y={(Y(lo) + 15).toFixed(1)} textAnchor="middle"
        fontSize="10" fill="var(--ink-35)">최저 {lo.toFixed(1)}</text>
      <text x={lastX.toFixed(1)} y={(lastY - 11).toFixed(1)} textAnchor="end"
        fontSize="11" fontWeight="500" fill="var(--accent)">{values[lastIdx].toFixed(1)}</text>
    </>
  }

  const gradId = `grad-${id}`

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A9543B" stopOpacity=".10" />
          <stop offset="100%" stopColor="#A9543B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={maPath} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {dots}
      <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r="4" fill="var(--accent)" />
      {labels}
    </svg>
  )
}

function filterByPeriod(entries: Entry[], period: Period): Entry[] {
  if (period === 'all') return entries
  const now = new Date()
  const days = period === '1w' ? 7 : period === '1m' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return entries.filter(e => e.date >= cutoffStr)
}

interface EditModalProps {
  entry: Entry
  onSave: (e: Entry) => void
  onDelete: (date: string) => void
  onClose: () => void
}

function EditModal({ entry, onSave, onDelete, onClose }: EditModalProps) {
  const [w, setW] = useState(entry.weight.toFixed(1))
  const [c, setC] = useState(entry.waist?.toFixed(1) ?? '')

  const handleSave = () => {
    const weight = parseFloat(w)
    const waist = c ? parseFloat(c) : undefined
    if (isNaN(weight)) return
    onSave({ ...entry, weight, waist })
    onClose()
  }

  const handleDelete = () => {
    if (confirm('이 기록을 삭제할까요?')) {
      onDelete(entry.date)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{formatDateLabel(entry.date)}</div>
        <div className="modal-field">
          <label>체중 (kg)</label>
          <input type="number" step="0.1" value={w} onChange={e => setW(e.target.value)} />
        </div>
        <div className="modal-field">
          <label>허리둘레 (cm, 선택)</label>
          <input type="number" step="0.1" value={c} onChange={e => setC(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="modal-delete" onClick={handleDelete}>삭제</button>
          <button className="modal-save" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  )
}

export default function StatsTab() {
  const [period, setPeriod] = useState<Period>('1m')
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [, forceUpdate] = useState(0)

  const allEntries = loadEntries()
  const filtered = filterByPeriod(allEntries, period)

  const weights = filtered.map(e => e.weight)
  const waists = filtered.filter(e => e.waist !== undefined).map(e => e.waist!)

  // 요약
  const startWeight = filtered[0]?.weight
  const latestWeight = filtered[filtered.length - 1]?.weight
  const startDiff = startWeight !== undefined && latestWeight !== undefined
    ? Math.round((latestWeight - startWeight) * 10) / 10
    : null
  const minWeight = weights.length > 0 ? Math.min(...weights) : null

  // 주간 변화: 최근 7일
  const now7 = filterByPeriod(allEntries, '1w')
  const weekChange = now7.length >= 2
    ? Math.round((now7[now7.length - 1].weight - now7[0].weight) * 10) / 10
    : null

  // 기록률
  const recordRate = filtered.length > 0 && period !== 'all' ? (() => {
    const days = period === '1w' ? 7 : period === '1m' ? 30 : 90
    return Math.round((filtered.length / days) * 100)
  })() : null

  const handleSave = (entry: Entry) => {
    upsertEntry(entry)
    forceUpdate(n => n + 1)
  }

  const handleDelete = (date: string) => {
    deleteEntry(date)
    forceUpdate(n => n + 1)
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key: '1w', label: '1주' },
    { key: '1m', label: '1달' },
    { key: '3m', label: '3달' },
    { key: 'all', label: '전체' },
  ]

  return (
    <div className="stats-tab">
      <div className="head stats-head">
        <div className="stats-title">통계</div>
      </div>

      <div className="seg">
        {PERIODS.map(p => (
          <button key={p.key} className={period === p.key ? 'on' : ''} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {weights.length < 2 ? (
        <div className="no-data">기록이 쌓이면 그래프가 그려져요</div>
      ) : (
        <>
          <div className="chart-block">
            <div className="chart-name">체중</div>
            <LineChart values={weights} height={150} pad={26} showLabels id="weight" />
          </div>
          {waists.length >= 2 && (
            <div className="chart-block">
              <div className="chart-name">허리둘레</div>
              <LineChart values={waists} height={90} pad={20} showLabels={false} id="waist" />
            </div>
          )}
        </>
      )}

      <div className="summary-grid">
        <div className="cell">
          <div className="cell-k">시작 대비</div>
          <div className={`cell-v ${startDiff !== null && startDiff < 0 ? 'acc' : ''}`}>
            {startDiff !== null ? (startDiff > 0 ? '+' : '') + startDiff.toFixed(1) : '—'}
            {startDiff !== null && <small>kg</small>}
          </div>
        </div>
        <div className="cell">
          <div className="cell-k">최저</div>
          <div className="cell-v">
            {minWeight !== null ? minWeight.toFixed(1) : '—'}
            {minWeight !== null && <small>kg</small>}
          </div>
        </div>
        <div className="cell">
          <div className="cell-k">주간 변화</div>
          <div className="cell-v">
            {weekChange !== null ? (weekChange > 0 ? '+' : '') + weekChange.toFixed(1) : '—'}
            {weekChange !== null && <small>kg</small>}
          </div>
        </div>
        <div className="cell">
          <div className="cell-k">기록률</div>
          <div className="cell-v">
            {recordRate !== null ? recordRate : '—'}
            {recordRate !== null && <small>%</small>}
          </div>
        </div>
      </div>

      <div className="list-name">기록</div>
      <div className="log-list">
        {[...filtered].reverse().map(entry => (
          <div
            key={entry.date}
            className="log-row"
            onContextMenu={e => { e.preventDefault(); setEditEntry(entry) }}
            onPointerDown={(() => {
              let timer: ReturnType<typeof setTimeout>
              return () => {
                timer = setTimeout(() => setEditEntry(entry), 600)
                document.addEventListener('pointerup', () => clearTimeout(timer), { once: true })
              }
            })()}
          >
            <span className="log-date">{formatEntryDate(entry.date)}</span>
            <span className="log-weight">{entry.weight.toFixed(1)} kg</span>
            <span className="log-waist">{entry.waist !== undefined ? entry.waist.toFixed(1) : '—'}</span>
          </div>
        ))}
      </div>
      <div className="log-hint">길게 눌러 수정하거나 지울 수 있어요</div>

      {editEntry && (
        <EditModal
          entry={editEntry}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  )
}
