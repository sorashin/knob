import { useState } from 'react';
import { Preview3D } from './components/Preview3D';
import { Knob } from './components/Knob';

export default function App() {
  const [pixelRatio, setPixelRatio] = useState(0.25);
  const hue = 596.8;
  const [saturation, setSaturation] = useState(28.19);
  const [lightness, setLightness] = useState(46.62);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#3a3a38]">
      <div
        className="w-[600px] h-[700px] rounded-3xl p-6 flex flex-col
          bg-[linear-gradient(145deg,#2a2a2a,#1a1a1a)]
          shadow-[20px_20px_60px_#0a0a0a,-20px_-20px_60px_#3a3a3a,inset_0_0_20px_rgba(0,0,0,0.2)]
          border border-[rgba(60,60,60,0.3)]"
      >
        {/* Preview Screen (Top Half) */}
        <div className="flex-1 mb-8">
          <Preview3D hue={hue} saturation={saturation} lightness={lightness} pixelRatio={pixelRatio} />
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
          />
          <Knob
            label="S"
            value={saturation}
            min={0}
            max={100}
            onChange={setSaturation}
          />
          <Knob
            label="L"
            value={lightness}
            min={0}
            max={100}
            onChange={setLightness}
          />
        </div>
      </div>
    </div>
  );
}
