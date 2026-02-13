import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CharacterClass, CharacterCreationData } from '../types/characterTypes';
import { CLASS_DEFINITIONS } from '../types/characterTypes';
import ClassSelector from '../components/ClassSelector';

interface CharacterCreationSceneProps {
  width: number;
  height: number;
  onComplete: (character: CharacterCreationData) => void;
  onBack: () => void;
}

export default function CharacterCreationScene({ 
  width, 
  height, 
  onComplete, 
  onBack 
}: CharacterCreationSceneProps) {
  const classOrder = useMemo(
    () => Object.keys(CLASS_DEFINITIONS) as CharacterClass[],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedClass = classOrder[selectedIndex];

  const handlePreviousClass = useCallback(() => {
    setSelectedIndex(prevIndex =>
      prevIndex === 0 ? classOrder.length - 1 : prevIndex - 1
    );
  }, [classOrder.length]);

  const handleNextClass = useCallback(() => {
    setSelectedIndex(prevIndex =>
      prevIndex === classOrder.length - 1 ? 0 : prevIndex + 1
    );
  }, [classOrder.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePreviousClass();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextClass();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleNextClass, handlePreviousClass]);

  const handleFinalConfirm = () => {
    onComplete({
      name: 'Hero',
      class: selectedClass,
      stats: { ...CLASS_DEFINITIONS[selectedClass].baseStats },
      appearance: {
        skinTone: 0,
        hairColor: 0,
        hairStyle: 0
      }
    });
  };

  return (
    <div
      className="mx-auto flex h-full w-full flex-col rounded-lg border border-slate-700 bg-slate-950/95 p-5 text-white"
      style={{ maxWidth: width, maxHeight: height }}
    >
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-amber-200">Character Creation</h2>
        <p className="text-sm text-slate-300">Choose your starting class.</p>
      </div>

      <div className="flex-1 overflow-auto">
        <ClassSelector
          selectedClass={selectedClass}
          onPrevious={handlePreviousClass}
          onNext={handleNextClass}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>

        <button type="button" className="btn btn-primary" onClick={handleFinalConfirm}>
          Start Adventure
        </button>
      </div>
    </div>
  );
}
