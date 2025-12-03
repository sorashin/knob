import { useState } from 'react';
import { ModularPreview3D } from './components/ModularPreview3D';
import { Knob } from './components/Knob';
import { FanGauge } from './components/FanGauge';

interface ActiveKnobState {
  label: string;
  value: number;
  min: number;
  max: number;
}

export default function App() {
  const [pixelRatio, setPixelRatio] = useState(0.25);
  const [innerDiameter, setInnerDiameter] = useState(8);
  const [lightness, setLightness] = useState(46.62);
  const [activeKnob, setActiveKnob] = useState<ActiveKnobState | null>(null);

  const handleKnobInteractionStart = (label: string, value: number, min: number, max: number) => {
    setActiveKnob({ label, value, min, max });
  };

  const handleKnobInteractionEnd = () => {
    setActiveKnob(null);
  };

  // Update active knob value when state changes
  if (activeKnob) {
      let currentValue = 0;
      if (activeKnob.label === "Px") currentValue = pixelRatio;
      else if (activeKnob.label === "D") currentValue = innerDiameter;
      else if (activeKnob.label === "L") currentValue = lightness;
      
      if (activeKnob.value !== currentValue) {
          // This might cause a render loop if we are not careful, but since we are updating state based on render...
          // Actually, we should just derive the current value from the state variables directly when passing to FanGauge.
          // But FanGauge needs generic props.
          // Better approach: just store the *label* of the active knob, and derive the rest.
      }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#3a3a38] relative">
      {activeKnob && (
        <FanGauge
          label={activeKnob.label}
          value={
            activeKnob.label === "Px" ? pixelRatio :
            activeKnob.label === "D" ? innerDiameter :
            activeKnob.label === "L" ? lightness : 0
          }
          min={activeKnob.min}
          max={activeKnob.max}
          visible={!!activeKnob}
        />
      )}
      <div
        className="w-[600px] h-[700px] rounded-3xl p-6 flex flex-col
          bg-[linear-gradient(145deg,#2a2a2a,#1a1a1a)]
          shadow-[20px_20px_60px_#0a0a0a,-20px_-20px_60px_#3a3a3a,inset_0_0_20px_rgba(0,0,0,0.2)]
          border border-[rgba(60,60,60,0.3)]"
      >
        {/* Preview Screen (Top Half) */}
        <div className="flex-1 mb-8">
          <ModularPreview3D pixelRatio={pixelRatio} innerDiameter={innerDiameter} />
        </div>

        {/* Knob Controls (Bottom Half) */}
        <div className="flex justify-around items-start pb-8">
          <Knob
            label="Px"
            value={pixelRatio}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setPixelRatio}
            onInteractionStart={() => handleKnobInteractionStart("Px", pixelRatio, 0.05, 1)}
            onInteractionEnd={handleKnobInteractionEnd}
          />
          <Knob
            label="D"
            value={innerDiameter}
            min={5}
            max={15}
            step={0.1}
            onChange={setInnerDiameter}
            onInteractionStart={() => handleKnobInteractionStart("D", innerDiameter, 5, 15)}
            onInteractionEnd={handleKnobInteractionEnd}
          />
          <Knob
            label="L"
            value={lightness}
            min={0}
            max={100}
            onChange={setLightness}
            onInteractionStart={() => handleKnobInteractionStart("L", lightness, 0, 100)}
            onInteractionEnd={handleKnobInteractionEnd}
          />
        </div>
      </div>
    </div>
  );
}
