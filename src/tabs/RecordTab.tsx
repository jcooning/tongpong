import { useState, useEffect, useRef, useCallback } from 'react'
import MascotScene from '../components/MascotScene'
import Ruler from '../components/Ruler'
import { loadEntries, upsertEntry, todayStr, offsetDate, formatDateLabel, consecutiveDays } from '../lib/storage'
import type { Entry } from '../lib/storage'
import './RecordTab.css'

function round1(v: number) {
  return Math.round(v * 10) / 10
}

export default function RecordTab() {
  const [currentDate, setCurrentDate] = useState(todayStr())
  const today = todayStr()

  const entries = loadEntries()

  const prevDate = offsetDate(currentDate, -1)
  const prevEntry = entries.find(e => e.date === prevDate)
  const currentEntry = entries.find(e => e.date === currentDate)

  // 참조 기준값: 어제 → 최근 → 기본값
  const refEntry = prevEntry ?? (entries.length > 0 ? entries[entries.length - 1] : undefined)

  const defaultWeight = currentEntry?.weight ?? refEntry?.weight ?? 70.0
  const defaultWaist = currentEntry?.waist ?? refEntry?.waist ?? 80.0

  const [weight, setWeight] = useState(round1(defaultWeight))
  const [waist, setWaist] = useState(round1(defaultWaist))
  const [saved, setSaved] = useState(currentEntry !== undefined)

  const streak = consecutiveDays(entries, today)

  // 날짜 바뀔 때 값 초기화
  useEffect(() => {
    const allEntries = loadEntries()
    const prev = allEntries.find(e => e.date === offsetDate(currentDate, -1))
    const cur = allEntries.find(e => e.date === currentDate)
    const ref = prev ?? (allEntries.length > 0 ? allEntries[allEntries.length - 1] : undefined)

    setWeight(round1(cur?.weight ?? ref?.weight ?? 70.0))
    setWaist(round1(cur?.waist ?? ref?.waist ?? 80.0))
    setSaved(cur !== undefined)
  }, [currentDate])

  // 길게 누르기
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLongPress = useCallback((fn: () => void) => {
    fn()
    const timeout = setTimeout(() => {
      timerRef.current = setInterval(fn, 80)
    }, 400)
    return () => {
      clearTimeout(timeout)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleWeightDown = (delta: number) => {
    const stop = startLongPress(() => setWeight(v => round1(v + delta)))
    return stop
  }

  const handleWaistDown = (delta: number) => {
    const stop = startLongPress(() => setWaist(v => round1(v + delta)))
    return stop
  }

  const stopLong = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSave = () => {
    const entry: Entry = {
      date: currentDate,
      weight,
      waist,
    }
    upsertEntry(entry)
    setSaved(true)
  }

  // 눈금 범위
  const wRef = prevEntry?.weight ?? weight
  const wLo = round1(wRef - 0.8)
  const wHi = round1(wRef + 0.8)
  const cRef = prevEntry?.waist ?? waist
  const cLo = round1(cRef - 0.8)
  const cHi = round1(cRef + 0.8)

  // 어제 줄
  const yesterdayLine = () => {
    if (!prevEntry) return <span>어제는 쉬었네요 🐾</span>
    const wDelta = round1(weight - prevEntry.weight)
    const sign = wDelta <= 0 ? '↓' : '↑'
    const absD = Math.abs(wDelta).toFixed(1)
    return (
      <>
        <span>
          어제 {prevEntry.weight.toFixed(1)}kg
          {prevEntry.waist !== undefined ? ` · ${prevEntry.waist.toFixed(1)}cm` : ''}
        </span>
        <span className="delta">{sign} {absD}</span>
      </>
    )
  }

  // 빈 화면 여부
  const isEmpty = entries.length === 0 && !saved

  return (
    <div className="record-tab">
      <div className="head">
        <div className="brand">통통이 &amp; 퐁퐁이</div>
        <div className="datewrap">
          <button className="nav" onClick={() => setCurrentDate(offsetDate(currentDate, -1))}>‹</button>
          <div className="date">{formatDateLabel(currentDate)}</div>
          <button className="nav" disabled={currentDate >= today} onClick={() => setCurrentDate(offsetDate(currentDate, 1))}>›</button>
        </div>
      </div>

      <MascotScene />

      <div className="yday">
        {isEmpty
          ? <span>아직 텅 비었어요. 첫 기록을 남겨볼까요?</span>
          : yesterdayLine()
        }
      </div>

      <div className="cards">
        {/* 체중 카드 */}
        <div className="card">
          <div className="label">
            <span>체중</span><span className="label-unit">kg</span>
          </div>
          <div className="row">
            <button
              className="btn"
              onPointerDown={() => { const stop = handleWeightDown(-0.1); document.addEventListener('pointerup', stop, { once: true }) }}
              onPointerCancel={stopLong}
            >−</button>
            <div className="val">{weight.toFixed(1)}</div>
            <button
              className="btn plus"
              onPointerDown={() => { const stop = handleWeightDown(0.1); document.addEventListener('pointerup', stop, { once: true }) }}
              onPointerCancel={stopLong}
            >+</button>
          </div>
          <Ruler value={weight} lo={wLo} hi={wHi} unit="kg" yesterdayValue={prevEntry?.weight} />
        </div>

        {/* 허리둘레 카드 */}
        <div className="card">
          <div className="label">
            <span>허리둘레</span><span className="label-unit">cm</span>
          </div>
          <div className="row">
            <button
              className="btn"
              onPointerDown={() => { const stop = handleWaistDown(-0.1); document.addEventListener('pointerup', stop, { once: true }) }}
              onPointerCancel={stopLong}
            >−</button>
            <div className="val">{waist.toFixed(1)}</div>
            <button
              className="btn plus"
              onPointerDown={() => { const stop = handleWaistDown(0.1); document.addEventListener('pointerup', stop, { once: true }) }}
              onPointerCancel={stopLong}
            >+</button>
          </div>
          <Ruler value={waist} lo={cLo} hi={cHi} unit="cm" yesterdayValue={prevEntry?.waist} />
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>기록할래요</button>
      {saved && (
        <div className="saved-msg">
          {streak > 0
            ? <>오늘도 성공! 🐾 &nbsp;{streak}일째 꾸준꾸준</>
            : <>오늘도 성공! 🐾</>
          }
        </div>
      )}
    </div>
  )
}
