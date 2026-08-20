import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { BodyData, BodyId } from "../data/types";
import { PLANETS } from "../data/planets";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { PLANET_INFO, type PlanetInfo } from "../data/planetInfo";
import {
  trackPlanetariumBodySelected,
  trackPlanetariumPickerToggled
} from "../../utils/firebaseAnalytics";

interface SelectionContextValue {
  selectedId: BodyId | null;
  selectedPlanet: BodyData | null;
  selectedInfo: PlanetInfo | null;
  isFocused: boolean;
  infoHidden: boolean;
  isInfoVisible: boolean;
  resetSignal: number;
  pickerOpen: boolean;
  pickerQuery: string;
  filteredPlanets: BodyData[];
  selectPlanet: (id: BodyId | null, source?: "canvas" | "picker" | "search") => void;
  clearSelection: () => void;
  resetOverview: () => void;
  setInfoHidden: (hidden: boolean) => void;
  closeInfo: () => void;
  setIsFocused: (focused: boolean) => void;
  setPickerOpen: (open: boolean) => void;
  setPickerQuery: (query: string) => void;
  togglePicker: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<BodyId | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [infoHidden, setInfoHidden] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const selectedPlanet = useMemo(
    () => (selectedId ? PLANET_BY_ID[selectedId] ?? null : null),
    [selectedId]
  );

  const selectedInfo = useMemo(
    () => (selectedId ? PLANET_INFO[selectedId] ?? null : null),
    [selectedId]
  );

  const isInfoVisible = useMemo(
    () => Boolean(selectedPlanet && !infoHidden),
    [selectedPlanet, infoHidden]
  );

  const filteredPlanets = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return PLANETS;
    return PLANETS.filter((planet) =>
      planet.name.toLowerCase().includes(query)
    );
  }, [pickerQuery]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setIsFocused(false);
    setInfoHidden(false);
  }, []);

  const selectPlanet = useCallback(
    (id: BodyId | null, source: "canvas" | "picker" | "search" = "canvas") => {
      setSelectedId(id);
      setIsFocused(false);
      setInfoHidden(false);
      if (source === "picker") {
        setPickerOpen(false);
      }
      if (id) {
        void trackPlanetariumBodySelected({
          bodyId: id,
          source
        });
      }
    },
    []
  );

  const resetOverview = useCallback(() => {
    clearSelection();
    setResetSignal((prev) => prev + 1);
    setPickerOpen(false);
  }, [clearSelection]);

  const closeInfo = useCallback(() => {
    clearSelection();
    setResetSignal((prev) => prev + 1);
  }, [clearSelection]);

  const togglePicker = useCallback(() => {
    setPickerOpen((prev) => {
      const next = !prev;
      void trackPlanetariumPickerToggled({ open: next });
      return next;
    });
  }, []);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectedId,
      selectedPlanet,
      selectedInfo,
      isFocused,
      infoHidden,
      isInfoVisible,
      resetSignal,
      pickerOpen,
      pickerQuery,
      filteredPlanets,
      selectPlanet,
      clearSelection,
      resetOverview,
      setInfoHidden,
      closeInfo,
      setIsFocused,
      setPickerOpen,
      setPickerQuery,
      togglePicker
    }),
    [
      selectedId,
      selectedPlanet,
      selectedInfo,
      isFocused,
      infoHidden,
      isInfoVisible,
      resetSignal,
      pickerOpen,
      pickerQuery,
      filteredPlanets,
      selectPlanet,
      clearSelection,
      resetOverview,
      closeInfo,
      togglePicker
    ]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function usePlanetSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error(
      "usePlanetSelection must be used within a SelectionProvider"
    );
  }
  return context;
}
