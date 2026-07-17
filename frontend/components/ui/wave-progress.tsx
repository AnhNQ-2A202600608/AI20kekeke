'use client';

import React from 'react';

interface WaveProgressProps {
  percent: number;
  color: string;
}

export const WaveProgress: React.FC<WaveProgressProps> = ({ percent, color }) => {
  // Enforce a minimum level of 12% so the bubble doesn't appear empty, up to 100%
  const displayPercent = Math.max(12, Math.min(100, percent));
  
  // Calculate the top level of the water in viewBox coordinate (0 to 100)
  const waveY = 100 - displayPercent;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full pointer-events-none z-0">
      {/* Wave 1: Back wave (moving right, lower opacity) */}
      <svg
        className="wave-progress-flow absolute left-0 top-0 w-[200%] h-[calc(100%+8px)] overflow-visible transition-all duration-500 ease-out"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={`M 0 ${waveY} Q 25 ${waveY - 4}, 50 ${waveY} T 100 ${waveY} T 150 ${waveY} T 200 ${waveY} L 200 100 L 0 100 Z`}
          fill={color}
          opacity="0.4"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Wave 2: Front wave (moving left, higher opacity) */}
      <svg
        className="wave-progress-flow-reverse absolute left-0 top-0 w-[200%] h-[calc(100%+8px)] overflow-visible transition-all duration-500 ease-out"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={`M 0 ${waveY} Q 25 ${waveY + 4}, 50 ${waveY} T 100 ${waveY} T 150 ${waveY} T 200 ${waveY} L 200 100 L 0 100 Z`}
          fill={color}
          opacity="0.8"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Glass highlights to create bubble/3D effect */}
      <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/25 z-10" />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 z-10" />
    </div>
  );
};
