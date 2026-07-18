import { GitBranch } from 'lucide-react';
import type { ProgramTrack } from '@/lib/quiz/types';

interface TrackSelectorProps {
  tracks: ProgramTrack[];
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  getTrackProgress: (trackId: string) => { completed: number; total: number };
}

export function TrackSelector({
  tracks,
  selectedTrackId,
  onSelectTrack,
  getTrackProgress,
}: TrackSelectorProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-green text-white">
          <GitBranch className="h-4 w-4 stroke-[3]" />
        </span>
        <div>
          <h2 className="font-fraunces text-base font-black text-on-background">Chọn track sau Day 16</h2>
          <p className="text-[11px] font-semibold text-stone-500">Chuyển track chỉ đổi nhánh Day 17-28, không đổi phần nền tảng chung.</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {tracks.map((track) => {
          const selected = track.id === selectedTrackId;
          const progress = getTrackProgress(track.id);

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelectTrack(track.id)}
              className={[
                'cursor-pointer rounded-2xl border-2 border-b-[5px] p-4 text-left transition active:translate-y-1 active:border-b-2',
                selected
                  ? 'border-secondary-green-dark bg-secondary-green text-white'
                  : 'border-gray-border bg-white text-on-background hover:border-secondary-green/60',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-fraunces text-sm font-black leading-tight">{track.title}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <p className={`mt-2 text-[11px] font-semibold leading-relaxed ${selected ? 'text-white/85' : 'text-stone-500'}`}>
                {track.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
