import React from 'react';
import { Info } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { ConceptMastery } from '../utils/profile-utils';

interface ConceptDetailDrawerProps {
  activeDrawerConcept: ConceptMastery | undefined;
  onClose: () => void;
  onStartPractice: (conceptId: string) => void;
}

export const ConceptDetailDrawer: React.FC<ConceptDetailDrawerProps> = ({
  activeDrawerConcept,
  onClose,
  onStartPractice,
}) => {
  if (!activeDrawerConcept) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-slide-up transform translate-y-0 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
          <h3 className="font-black text-stone-900 text-base font-serif">
            {activeDrawerConcept.name}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 font-bold text-lg cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Drawer Stats */}
        <div className="space-y-3 text-xs leading-relaxed text-stone-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-150">
              <p className="text-kicker-micro font-extrabold text-stone-400 uppercase">Điểm Elo Năng lực</p>
              <p className="text-lg font-mono font-black text-accent-orange mt-1">
                {activeDrawerConcept.elo}{' '}
                {activeDrawerConcept.status === 'cold_start' ? '(Cold Start)' : ''}
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-150">
              <p className="text-kicker-micro font-extrabold text-stone-400 uppercase">Trạng thái BKT Mastery</p>
              <p className="text-lg font-mono font-black text-primary-green-dark mt-1">
                {activeDrawerConcept.bktVal}%
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-warm-cream border border-accent-orange/20 rounded-xl space-y-1">
            <p className="font-bold text-caption-tight text-accent-orange-dark uppercase tracking-wider font-mono">
              BKT Parameters
            </p>
            <div className="grid grid-cols-4 gap-2 text-center text-kicker-micro font-semibold text-stone-500 pt-1 border-t border-stone-100 mt-1">
              <div>
                <p>Prior P(L)</p>
                <p className="font-mono text-stone-800 font-bold mt-0.5">0.25</p>
              </div>
              <div>
                <p>Transition P(T)</p>
                <p className="font-mono text-stone-800 font-bold mt-0.5">0.06</p>
              </div>
              <div>
                <p>Guess P(G)</p>
                <p className="font-mono text-stone-800 font-bold mt-0.5">0.20</p>
              </div>
              <div>
                <p>Slip P(S)</p>
                <p className="font-mono text-stone-800 font-bold mt-0.5">0.10</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 text-label-tight space-y-1">
            <p className="font-bold text-stone-750">Mối quan hệ tiên quyết (Prerequisites DAG):</p>
            <p>{activeDrawerConcept.prereq}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <ActionButton
            type="button"
            onClick={() => {
              onClose();
              onStartPractice(activeDrawerConcept.id);
            }}
            variant="orange"
            size="md"
            className="flex-1"
          >
            Ôn luyện ngay
          </ActionButton>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center border border-stone-250"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
