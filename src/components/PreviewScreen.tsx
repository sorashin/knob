interface PreviewScreenProps {
  hue: number;
  saturation: number;
  lightness: number;
}

export function PreviewScreen({ hue, saturation, lightness }: PreviewScreenProps) {
  const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <div className="relative w-full h-full p-4">
      <div
        className="w-full h-full rounded-2xl transition-colors duration-300
          shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor,
        }}
      />
    </div>
  );
}

