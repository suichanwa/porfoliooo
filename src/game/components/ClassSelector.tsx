import { AnimatePresence, motion } from 'framer-motion';
import type { CharacterClass } from '../types/characterTypes';
import { CLASS_DEFINITIONS } from '../types/characterTypes';

interface ClassSelectorProps {
  selectedClass: CharacterClass;
  onPrevious: () => void;
  onNext: () => void;
}

const statOrder = [
  'strength',
  'dexterity',
  'intelligence',
  'constitution',
  'wisdom',
  'charisma'
] as const;

function formatStatName(stat: string): string {
  return stat.charAt(0).toUpperCase() + stat.slice(1);
}

export default function ClassSelector({ selectedClass, onPrevious, onNext }: ClassSelectorProps) {
  const classData = CLASS_DEFINITIONS[selectedClass];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-outline btn-sm w-10 px-0 text-lg"
          onClick={onPrevious}
          aria-label="Previous class"
          title="Previous class"
        >
          ←
        </button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={`${selectedClass}-title`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="text-center text-2xl font-bold text-amber-200"
          >
            {classData.name}
          </motion.h3>
        </AnimatePresence>

        <button
          type="button"
          className="btn btn-outline btn-sm w-10 px-0 text-lg"
          onClick={onNext}
          aria-label="Next class"
          title="Next class"
        >
          →
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`${selectedClass}-description`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="mb-4 text-sm text-slate-200"
        >
          {classData.description}
        </motion.p>
      </AnimatePresence>

      <div className="mb-4 rounded-md border border-slate-700 bg-slate-950/60 p-3">
        <p className="text-xs uppercase tracking-wide text-emerald-300">
          Primary Stat: {classData.primaryStat}
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Abilities: <span className="text-sky-300">{classData.abilities.join(', ')}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-700 bg-slate-950/60 p-3 text-sm">
        {statOrder.map(stat => (
          <p key={stat} className="text-slate-100">
            {formatStatName(stat)}:{' '}
            <span className="inline-block min-w-[1.5rem] text-right">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`${selectedClass}-${stat}-value`}
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.92 }}
                  transition={{ duration: 0.16 }}
                  className="inline-block font-semibold text-amber-100"
                >
                  {classData.baseStats[stat]}
                </motion.span>
              </AnimatePresence>
            </span>
          </p>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">Use Left/Right arrows to change class.</p>
    </div>
  );
}
