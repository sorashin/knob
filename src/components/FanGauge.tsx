import { useMemo } from 'react';

interface FanGaugeProps {
  value: number;
  min: number;
  max: number;
  subStep?: number;
  mainStep?: number;
  label: string;
  visible: boolean;
}

export function FanGauge({ value, min, max, subStep, mainStep, label, visible }: FanGaugeProps) {
  const arcRadius = 600; // Adjusted radius for the screen size
  const arcAngle = 120; // Adjusted angle
  
  // Calculate ticks based on subStep (細かい目盛り)
  // If subStep is provided, calculate the exact number of ticks needed
  // Otherwise, default to a reasonable number
  const tickCount = subStep 
    ? Math.round((max - min) / subStep) + 1 
    : 41;
  
  const ticks = useMemo(() => {
    return Array.from({ length: tickCount }, (_, i) => {
      const tickValue = min + (i / (tickCount - 1)) * (max - min);
      const isCurrent = Math.abs(tickValue - value) < (max - min) / (tickCount - 1) / 2;
      
      // Calculate angle: map value to angle
      // We want the current 'value' to be at angle 0 (center).
      // valueRatio is the position of the current value in the range [0, 1]
      const valueRatio = (value - min) / (max - min);
      
      // tickRatio is the position of this tick in the range [0, 1]
      const tickRatio = i / (tickCount - 1);
      
      // We want to rotate the whole fan so that 'value' is at the top (0 deg).
      // The fan spans from -arcAngle/2 to +arcAngle/2 relative to the center.
      // The angle of a specific tick relative to the start of the range:
      // tickAngle = -arcAngle/2 + tickRatio * arcAngle
      
      // But we want to rotate the view such that the 'value' is at 0.
      // The angle of 'value' relative to start is:
      // valueAngle = -arcAngle/2 + valueRatio * arcAngle
      
      // So the rotation needed for a tick to be displayed relative to the center 0:
      // displayedAngle = tickAngle - valueAngle
      //                = (-arcAngle/2 + tickRatio * arcAngle) - (-arcAngle/2 + valueRatio * arcAngle)
      //                = (tickRatio - valueRatio) * arcAngle
      
      // BUT, the reference implementation does something slightly different effectively.
      // Let's try to match the logic: 
      // centerAngleOffset = valueRatio * arcAngle - arcAngle / 2
      // baseAngle = -arcAngle / 2 + (arcAngle / (tickCount - 1)) * i
      // angleInDegrees = baseAngle - centerAngleOffset
      
      const centerAngleOffset = valueRatio * arcAngle - arcAngle / 2;
      const baseAngle = -arcAngle / 2 + tickRatio * arcAngle;
      const angleInDegrees = baseAngle - centerAngleOffset;

      // Only render if within visible range (optional optimization)
      if (Math.abs(angleInDegrees) > 90) return null;

      // Style calculation - adjust for step-based ticks
      // Check if this tick aligns with mainStep
      const isMainStepTick = mainStep 
        ? Math.abs(tickValue % mainStep) < 0.001 || Math.abs(tickValue % mainStep - mainStep) < 0.001
        : Math.abs(tickValue % 1) < 0.001 || Math.abs(tickValue % 1 - 1) < 0.001;
      
      const tickLength = isMainStepTick ? 600 : 580;

      return (
        <div
          key={i}
          className="absolute flex flex-col items-center justify-end origin-bottom-center"
          style={{
            height: `${arcRadius}px`,
            transform: `rotate(${angleInDegrees}deg)`,
            transformOrigin: 'bottom center',
            bottom: `-${arcRadius - 40}px`, // Push down so only top is visible
            left: '50%',
            width: '2px',
            pointerEvents: 'none', // Ensure it doesn't block interactions
          }}
        >
          <div
            className={`w-[2px] ${isCurrent ? 'bg-white' : 'bg-gray-400'} rounded-full transition-all duration-200`}
            style={{
              height: `${tickLength}px`,
              minHeight: `${tickLength}px`, // Ensure minimum height
              display: 'block', // Ensure display
              opacity: Math.max(0, 1 - Math.abs(angleInDegrees) / 60), // Fade out at edges
            }}
          />
          {isMainStepTick && (
            <span
              className={`absolute -top-6 text-xs font-mono ${isCurrent ? 'text-white font-bold' : 'text-gray-500'}`}
              style={{
                transform: `rotate(${-angleInDegrees}deg)`, // Keep text upright
                opacity: Math.max(0, 1 - Math.abs(angleInDegrees) / 60),
              }}
            >
              {Number.isInteger(tickValue) ? tickValue : tickValue.toFixed(2)}
            </span>
          )}
        </div>
      );
    });
  }, [value, min, max, subStep, mainStep, tickCount, arcRadius, arcAngle]);

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] overflow-hidden pointer-events-none transition-opacity duration-300 z-50 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
       {/* Center Marker */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-red-500 z-10 mb-10" />
      
      {/* Ticks Container */}
      <div className="absolute bottom-0 left-0 w-full h-full">
        {ticks}
      </div>
      
      {/* Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

