interface PlanetariumViewerProps {
  className?: string;
}

export default function PlanetariumViewer({ className = '' }: PlanetariumViewerProps) {
  return (
    <div className={`planetarium-viewer ${className}`}>
      <div className="viewer-content">
        <h2 className="text-2xl font-bold text-white mb-4">
          Interactive Planetarium
        </h2>
        <p className="text-white/70">
          Solar system visualization coming soon...
        </p>
      </div>
    </div>
  );
}