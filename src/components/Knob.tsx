import { useRef, useState, useEffect, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export function Knob({ label, value, min, max, step, onChange, onInteractionStart, onInteractionEnd }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);

  // Convert value to angle (-135 to 135 degrees)
  const valueToAngle = (val: number) => {
    const percentage = (val - min) / (max - min);
    return -135 + percentage * 270;
  };

  const angle = valueToAngle(value);

  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
    onInteractionStart?.();
    e.preventDefault();
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartValue(value);
    onInteractionStart?.();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      // Adjust sensitivity based on the range of values
      const range = max - min;
      const sensitivity = range / 200; // Dragging 200px covers the full range
      let newValue = Math.min(max, Math.max(min, startValue + deltaX * sensitivity));

      if (step) {
        newValue = Math.round(newValue / step) * step;
      }

      // Round to avoid floating point issues, using a reasonable precision based on step or value
      const precision = step ? (step.toString().split('.')[1]?.length || 0) : 2;
      onChange(Number(newValue.toFixed(precision)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const deltaX = e.touches[0].clientX - startX;
      const range = max - min;
      const sensitivity = range / 200;
      let newValue = Math.min(max, Math.max(min, startValue + deltaX * sensitivity));

      if (step) {
         newValue = Math.round(newValue / step) * step;
      }

      const precision = step ? (step.toString().split('.')[1]?.length || 0) : 2;
      onChange(Number(newValue.toFixed(precision)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onInteractionEnd?.();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, startX, startValue, min, max, step, onChange, onInteractionEnd]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Knob Body */}
      <div
        ref={knobRef}
        className="relative w-24 h-24 rounded-full cursor-ew-resize select-none
          bg-[linear-gradient(180deg,#505050_0%,#1a1a1a_50%,#0a0a0a_100%)]
          shadow-[0_1px_0_rgba(100,100,100,0.3),0_8px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.5)]
          border-2 border-[rgba(0,0,0,0.8)]
          active:cursor-ew-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Inner Ring */}
        <div
          className="absolute inset-[10px] rounded-full
            bg-[linear-gradient(180deg,#4a4a4a_0%,#3a3a3a_50%,#2a2a2a_100%)]
            shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.8)]"
        >
          {/* Center Circle */}
          <div
            className="absolute inset-[2px] rounded-full
              "
          >
            {/* Indicator */}
            <div
              className="absolute inset-0 transition-transform duration-100 will-change-transform"
              style={{
                transform: `rotate(${angle}deg)`,
              }}
            >
              <div
                className="absolute top-[8px] left-1/2 w-[2px] h-[28px] -ml-[1px] rounded-full
                  bg-[linear-gradient(180deg,#ffffff_0%,#e0e0e0_50%,#c0c0c0_100%)]
                  shadow-[0_1px_3px_rgba(0,0,0,0.8),0_0_1px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Label and Value */}
      <div className="flex flex-col items-center font-mono">
        <div className="text-gray-500 uppercase tracking-wider mb-1 text-sm">{label}</div>
        <div className="text-white font-bold">{value.toFixed(2)}</div>
        <div className="text-gray-600 text-xs mt-1">{angle >= 0 ? '+' : ''}{Math.round(angle)}°</div>
      </div>
    </div>
  );
}

