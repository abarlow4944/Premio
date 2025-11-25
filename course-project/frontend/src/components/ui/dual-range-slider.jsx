import React, { useEffect, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'

export function DualRangeSlider({ label, value = [0, 100], onValueCommit, min = 0, max = 100, step = 1 }) {
  const displayLabel = (v) => (typeof label === 'function' ? label(v) : v);
  const [localValue, setLocalValue] = useState(Array.isArray(value) ? value : [0, 0]);

  useEffect(() => {
    if (!Array.isArray(value)) return;
    setLocalValue(value);
  }, [value]);

  return (
    <div className="DualRangeSlider w-full">
      <div className="flex items-center justify-between text-xs mb-1 text-white">
        <span>{displayLabel(localValue[0])}</span>
        <span>{displayLabel(localValue[1])}</span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={(v) => setLocalValue(v)}
        onValueCommit={(v) => onValueCommit && onValueCommit(v)}
        aria-label="Range"
      >
        <Slider.Track className="relative h-1 w-full rounded-full bg-strawberry-red-400/100">
          <Slider.Range className="absolute h-full rounded-full bg-white" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-strawberry-red-500 rounded-full -translate-y-1/2 shadow focus:outline-none focus:ring-2 focus:ring-strawberry-red-300 transition" />
        <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-strawberry-red-500 rounded-full -translate-y-1/2 shadow focus:outline-none focus:ring-2 focus:ring-strawberry-red-300 transition" />
      </Slider.Root>
    </div>
  )
}

export default DualRangeSlider
