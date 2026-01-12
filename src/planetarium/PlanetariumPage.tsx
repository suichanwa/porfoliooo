import PlanetariumCanvas from "./PlanetariumCanvas";
import CameraRig from "./CameraRig";
import UniverseBackground from "./UniverseBackground";

export default function PlanetariumPage() {
  return (
    <div className="relative min-h-screen">
      <PlanetariumCanvas>
        <UniverseBackground />
        <CameraRig />
      </PlanetariumCanvas>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-base-100/10 p-6 text-center text-white/90 shadow-xl backdrop-blur-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-primary-accent">
            Planetarium
          </h1>
          <p className="mt-3 text-sm text-white/70">
            Interactive solar system coming online soon.
          </p>
        </div>
      </div>
    </div>
  );
}
