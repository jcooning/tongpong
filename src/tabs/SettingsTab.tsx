import { loadEntries, saveEntries } from '../lib/storage'
import type { Entry } from '../lib/storage'
import './SettingsTab.css'

function exportCSV(entries: Entry[]) {
  const header = 'date,weight,waist\n'
  const rows = entries.map(e => `${e.date},${e.weight},${e.waist ?? ''}`).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tongpong_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function importCSV(onDone: () => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n').slice(1) // 헤더 제거
      const incoming: Entry[] = []
      for (const line of lines) {
        const [date, weightStr, waistStr] = line.split(',')
        const weight = parseFloat(weightStr)
        if (!date || isNaN(weight)) continue
        const waist = waistStr ? parseFloat(waistStr) : undefined
        incoming.push({ date: date.trim(), weight, waist: waist !== undefined && !isNaN(waist) ? waist : undefined })
      }
      const existing = loadEntries()
      const merged = [...existing]
      let overwriteCount = 0
      for (const inc of incoming) {
        const idx = merged.findIndex(e => e.date === inc.date)
        if (idx >= 0) {
          overwriteCount++
          merged[idx] = inc
        } else {
          merged.push(inc)
        }
      }
      if (overwriteCount > 0) {
        if (!confirm(`${overwriteCount}개의 날짜가 겹칩니다. 덮어쓸까요?`)) return
      }
      saveEntries(merged)
      onDone()
      alert(`${incoming.length}개 기록을 가져왔어요.`)
    }
    reader.readAsText(file)
  }
  input.click()
}

function showHomeScreenGuide() {
  alert('Safari에서 공유 버튼(네모+화살표)을 누른 뒤\n"홈 화면에 추가"를 선택하세요.')
}

export default function SettingsTab() {
  const entries = loadEntries()

  const handleExport = () => exportCSV(entries)
  const handleImport = () => importCSV(() => window.location.reload())

  const handleClearAll = () => {
    if (!confirm('기록을 전부 지울까요?')) return
    if (!confirm('정말요? 되돌릴 수 없어요.')) return
    saveEntries([])
    window.location.reload()
  }

  return (
    <div className="settings-tab">
      <div className="head settings-head">
        <div className="settings-title">설정</div>
      </div>

      <div className="group">
        <div className="gname">백업</div>
        <div className="list">
          <div className="item" onClick={handleExport}>
            <div>
              기록 내보내기
              <div className="sub">CSV 파일로 저장 · {entries.length}개</div>
            </div>
            <span className="chev">›</span>
          </div>
          <div className="item" onClick={handleImport}>
            <div>
              기록 가져오기
              <div className="sub">CSV 파일에서 불러오기</div>
            </div>
            <span className="chev">›</span>
          </div>
        </div>
        <div className="hint">기록은 이 아이폰 안에만 있어요. 폰을 바꾸기 전에 꼭 내보내 두세요.</div>
      </div>

      <div className="group">
        <div className="gname">도움말</div>
        <div className="list">
          <div className="item" onClick={showHomeScreenGuide}>
            <div>홈 화면에 추가하는 법</div>
            <span className="chev">›</span>
          </div>
        </div>
      </div>

      <div className="group">
        <div className="list">
          <div className="item danger" onClick={handleClearAll}>
            <div>기록 전체 지우기</div>
          </div>
        </div>
      </div>

      <div className="foot">통통이와 퐁퐁이 · 1.0</div>
    </div>
  )
}
