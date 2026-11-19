import Planet from "../bodies/Planet";
import ModelMesh from "../bodies/ModelMesh";
import Labels from "../ui/Labels";
import {
  useOrbitingPlanet,
  type UseOrbitingPlanetOptions
} from "../hooks/useOrbitingPlanet";

interface OrbitingPlanetProps extends UseOrbitingPlanetOptions {
  atmosphere?: boolean;
  showLabels?: boolean;
  isSelected?: boolean;
  isInfoVisible?: boolean;
}

export default function OrbitingPlanet({
  data,
  timeRef,
  atmosphere = false,
  showLabels = false,
  isSelected = false,
  isInfoVisible = false,
  onSelect,
  onObjectRef,
  planetRefs,
  scaleMode,
  scaleParams,
  activeSystemId,
  moonSystemVisRef
}: OrbitingPlanetProps) {
  const {
    groupRef,
    hoveredRef,
    initialPosition,
    shouldLoadTextures,
    handlePointerOver,
    handlePointerOut,
    handleClick
  } = useOrbitingPlanet({
    data,
    timeRef,
    onSelect,
    onObjectRef,
    planetRefs,
    scaleMode,
    scaleParams,
    activeSystemId,
    moonSystemVisRef
  });

  return (
    <>
      {data.render.modelUrl ? (
        <ModelMesh
          data={data}
          position={initialPosition}
          isSelected={isSelected}
          groupRef={groupRef}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      ) : (
        <Planet
          data={data}
          position={initialPosition}
          atmosphere={atmosphere}
          groupRef={groupRef}
          planetRefs={planetRefs}
          simTimeRef={timeRef}
          loadTextures={shouldLoadTextures}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        />
      )}
      {showLabels && (
        <Labels
          data={data}
          timeRef={timeRef}
          showLabels={showLabels}
          isSelected={isSelected}
          isInfoVisible={isInfoVisible}
          onSelect={onSelect}
          hoveredRef={hoveredRef}
          planetRefs={planetRefs}
          scaleMode={scaleMode}
          scaleParams={scaleParams}
          activeSystemId={activeSystemId}
          moonSystemVisRef={moonSystemVisRef}
        />
      )}
    </>
  );
}
