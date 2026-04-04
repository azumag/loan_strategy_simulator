import { ReactNode } from 'react'

interface SliderInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  note?: ReactNode
  className?: string
}

export function SliderInput({
  label, value, onChange, min, max, step = 1, unit = '', note, className = '',
}: SliderInputProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-24 border border-gray-300 rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {unit && <span className="text-xs text-gray-500 whitespace-nowrap">{unit}</span>}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200"
          style={{
            background: `linear-gradient(to right, #2563eb ${pct}%, #e5e7eb ${pct}%)`,
          }}
        />
      </div>
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  )
}
