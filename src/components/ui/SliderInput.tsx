import { LucideIcon } from 'lucide-react'

type SliderInputProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string
  note?: string
  className?: string
  icon?: LucideIcon
}

export function SliderInput({
  label, value, onChange, min, max, step, unit, note, className, icon: Icon,
}: SliderInputProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={`card p-4 anim-slide ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={14} style={{ color: 'var(--fg-3)' }} />}
        <label className="text-xs font-bold t-fg2">{label}</label>
        <div className="ml-auto flex items-baseline gap-1">
          <span className="kpi-num t-brand" style={{ fontSize: 18 }}>{value}</span>
          {unit && <span className="text-[10px] t-fg4">{unit}</span>}
        </div>
      </div>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="flex justify-between text-[10px] t-fg4 mt-1 font-mono">
        <span>{min}{unit}</span>
        <span className="t-fg3 font-semibold">{pct.toFixed(0)}%</span>
        <span>{max}{unit}</span>
      </div>
      {note && <p className="text-[11px] t-fg3 mt-2">{note}</p>}
    </div>
  )
}
