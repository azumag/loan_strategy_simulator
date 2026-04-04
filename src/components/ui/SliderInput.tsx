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
}

export function SliderInput({ label, value, onChange, min, max, step, unit, note, className }: SliderInputProps) {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-blue-600">
          {value}{unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit && <span className="ml-0.5">{unit}</span>}</span>
        <span>{max}{unit && <span className="ml-0.5">{unit}</span>}</span>
      </div>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
    </div>
  )
}
