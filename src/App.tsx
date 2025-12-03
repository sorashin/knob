import { useState } from 'react';
import { ModularPreview3D } from './components/ModularPreview3D';
import { PolygonsToolPreview3D } from './components/PolygonsToolPreview3D';
import { Knob } from './components/Knob';
import { FanGauge } from './components/FanGauge';

interface ActiveKnobState {
  label: string;
  value: number;
  min: number;
  max: number;
  subStep?: number;
  mainStep?: number;
}

export default function App() {
  const [pixelRatio, setPixelRatio] = useState(0.25);
  const [innerDiameter, setInnerDiameter] = useState(8);
  const [diameter, setDiameter] = useState(112);
  const [lightness, setLightness] = useState(46.62);
  const [activeKnob, setActiveKnob] = useState<ActiveKnobState | null>(null);
  const [showJewelry, setShowJewelry] = useState(false);

  const handleKnobInteractionStart = (label: string, value: number, min: number, max: number, subStep?: number, mainStep?: number) => {
    setActiveKnob({ label, value, min, max, subStep, mainStep });
  };

  const handleKnobInteractionEnd = () => {
    setActiveKnob(null);
  };

  // Determine current value based on label
  const getCurrentValue = (label: string) => {
    if (label === "Px") return pixelRatio;
    if (label === "D") {
      return showJewelry ? innerDiameter : diameter;
    }
    if (label === "L") return lightness;
    return 0;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#3a3a38] relative">
      {activeKnob && (
        <FanGauge
          label={activeKnob.label}
          value={getCurrentValue(activeKnob.label)}
          min={activeKnob.min}
          max={activeKnob.max}
          subStep={activeKnob.subStep}
          mainStep={activeKnob.mainStep}
          visible={!!activeKnob}
        />
      )}
      <div
        className="w-[600px] h-[700px] rounded-3xl p-6 flex flex-col"
      >
        {/* Preview Screen (Top Half) */}
        <div className="flex-1 p-2 mb-8 rounded-3xl bg-[linear-gradient(145deg,#343434,#1a1a1a)]
          
          border border-[rgba(60,60,60,0.3)]">
          {showJewelry ? (
            <ModularPreview3D pixelRatio={pixelRatio} innerDiameter={innerDiameter} />
          ) : (
            <PolygonsToolPreview3D pixelRatio={pixelRatio} diameter={diameter} />
          )}
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
            onInteractionStart={() => handleKnobInteractionStart("Px", pixelRatio, 0.05, 1, 0.05, 0.1)}
            onInteractionEnd={handleKnobInteractionEnd}
            onHoverStart={() => handleKnobInteractionStart("Px", pixelRatio, 0.05, 1, 0.05, 0.1)}
            onHoverEnd={handleKnobInteractionEnd}
          />
          {showJewelry ? (
            <Knob
              label="D"
              value={innerDiameter}
              min={5}
              max={15}
              step={0.1}
              onChange={setInnerDiameter}
              onInteractionStart={() => handleKnobInteractionStart("D", innerDiameter, 5, 15, 0.1, 1)}
              onInteractionEnd={handleKnobInteractionEnd}
              onHoverStart={() => handleKnobInteractionStart("D", innerDiameter, 5, 15, 0.1, 1)}
              onHoverEnd={handleKnobInteractionEnd}
            />
          ) : (
            <Knob
              label="D"
              value={diameter}
              min={80}
              max={250}
              step={1}
              onChange={setDiameter}
              onInteractionStart={() => handleKnobInteractionStart("D", diameter, 80, 250, 1, 10)}
              onInteractionEnd={handleKnobInteractionEnd}
              onHoverStart={() => handleKnobInteractionStart("D", diameter, 80, 250, 1, 10)}
              onHoverEnd={handleKnobInteractionEnd}
            />
          )}
          <Knob
            label="L"
            value={lightness}
            min={0}
            max={100}
            onChange={setLightness}
            onInteractionStart={() => handleKnobInteractionStart("L", lightness, 0, 100, 1, 10)}
            onInteractionEnd={handleKnobInteractionEnd}
            onHoverStart={() => handleKnobInteractionStart("L", lightness, 0, 100, 1, 10)}
            onHoverEnd={handleKnobInteractionEnd}
          />
          <button className="print-button size-24 cursor-pointer">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
