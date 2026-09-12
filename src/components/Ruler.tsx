import './Ruler.css'

interface Props {
  value: number
  lo: number
  hi: number
  unit: string
  yesterdayValue?: number
}

export default function Ruler({ value, lo, hi, unit, yesterdayValue }: Props) {
  const span = hi - lo || 1
  const pct = Math.min(100, Math.max(0, ((value - lo) / span) * 100))

  return (
    <div className="ruler">
      <div className="ruler-ticks">
        {Array.from({ length: 21 }, (_, i) => (
          <i key={i} className={i % 5 === 0 ? 'mid' : ''} />
        ))}
      </div>
      <div className="ruler-mark" style={{ left: `${pct}%` }} />
      <div className="ruler-legend">
        <span>{lo.toFixed(1)}</span>
        <span className="now">오늘</span>
        {yesterdayValue !== undefined
          ? <span>어제 {yesterdayValue.toFixed(1)}{unit}</span>
          : <span>{hi.toFixed(1)}</span>
        }
      </div>
    </div>
  )
}
