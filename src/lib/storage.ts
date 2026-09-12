export type Entry = {
  date: string   // "2026-09-09" 로컬 기준
  weight: number // kg, 소수점 1자리
  waist?: number // cm, 없으면 미기록
}

const KEY = 'tongpong_entries'

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Entry[]
    return parsed.sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]): void {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  localStorage.setItem(KEY, JSON.stringify(sorted))
}

export function upsertEntry(entry: Entry): void {
  const entries = loadEntries()
  const idx = entries.findIndex(e => e.date === entry.date)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  saveEntries(entries)
}

export function deleteEntry(date: string): void {
  const entries = loadEntries().filter(e => e.date !== date)
  saveEntries(entries)
}

export function getEntry(date: string): Entry | undefined {
  return loadEntries().find(e => e.date === date)
}

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]
  return `${y}.${m}.${day} ${dow}`
}

export function consecutiveDays(entries: Entry[], upToDate: string): number {
  if (entries.length === 0) return 0
  let count = 0
  let check = upToDate
  while (true) {
    if (entries.find(e => e.date === check)) {
      count++
      check = offsetDate(check, -1)
    } else {
      break
    }
  }
  return count
}
