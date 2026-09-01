import { createContext, useContext, useState, type ReactNode } from "react";
import type { DistanceScaleMode } from "../utils/distanceScale";

export interface PlanetariumSettings {
  showOrbits: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showPerf: boolean;
  useMilkyWayBackground: boolean;
  orbitSpeed: number;
  distanceScaleMode: DistanceScaleMode;
  distanceScaleSpacing: number;
  viewMode: "overview" | "explore" | "custom";
}

const DEFAULT_SETTINGS: PlanetariumSettings = {
  showOrbits: true,
  showLabels: false,
  showGrid: false,
  showPerf: false,
  useMilkyWayBackground: false,
  orbitSpeed: 1.0,
  distanceScaleMode: "log",
  distanceScaleSpacing: 40,
  viewMode: "overview"
};

interface SettingsContextValue {
  settings: PlanetariumSettings;
  updateSetting: <K extends keyof PlanetariumSettings>(
    key: K,
    value: PlanetariumSettings[K]
  ) => void;
  toggleSetting: (key: keyof PlanetariumSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlanetariumSettings>(DEFAULT_SETTINGS);

  const updateSetting = <K extends keyof PlanetariumSettings>(
    key: K,
    value: PlanetariumSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: keyof PlanetariumSettings) => {
    setSettings((prev) => {
      const val = prev[key];
      if (typeof val === "boolean") {
        return { ...prev, [key]: !val };
      }
      return prev;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
