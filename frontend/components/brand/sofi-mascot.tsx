'use client';

import React from 'react';
import { motion } from 'motion/react';

export type SofiExpression = 'smile' | 'dot' | 'wink' | 'thinking' | 'flat';

interface SofiMascotProps {
  size?: number;
  animated?: boolean;
  isTyping?: boolean;
  expression?: SofiExpression;
  className?: string;
}

export const SofiMascot: React.FC<SofiMascotProps> = ({
  size = 40,
  animated = true,
  isTyping = false,
  expression = 'smile',
  className = '',
}) => {
  // Animation states for the entire fox head
  const containerVariants = {
    idle: {
      y: [0, -2, 0],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut' as const,
      },
    },
    typing: {
      y: [0, -5, 0],
      transition: {
        repeat: Infinity,
        duration: 0.8,
        ease: 'easeInOut' as const,
      },
    },
    static: {
      y: 0,
    },
  };

  const currentVariant = !animated ? 'static' : isTyping ? 'typing' : 'idle';

  // Ear twitch animation variants (triggered on hover)
  const leftEarVariants = {
    hover: {
      rotate: [0, -10, 6, -4, 0],
      transition: {
        duration: 0.6,
        ease: 'easeInOut' as const,
      },
    },
  };

  const rightEarVariants = {
    hover: {
      rotate: [0, 10, -6, 4, 0],
      transition: {
        duration: 0.6,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Periodic glasses/eyeballs blink animation
  const glassesBlinkVariants = {
    animate: {
      scaleY: [1, 0.1, 1],
      transition: {
        repeat: Infinity,
        duration: 3.5,
        repeatDelay: 2,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Render eyes based on expression state
  const renderEyes = () => {
    switch (expression) {
      case 'dot':
        return (
          <>
            <circle cx="43" cy="53" r="5" fill="#171e12" />
            <circle cx="77" cy="53" r="5" fill="#171e12" />
          </>
        );
      case 'wink':
        return (
          <>
            {/* Left eye: closed smile */}
            <path d="M38 53 Q43 49 48 53" fill="none" stroke="#171e12" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right eye: open dot */}
            <circle cx="77" cy="53" r="5" fill="#171e12" />
          </>
        );
      case 'flat':
        return (
          <>
            <line x1="38" y1="53" x2="48" y2="53" stroke="#171e12" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="53" x2="82" y2="53" stroke="#171e12" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Skeptical/raised eyebrows with dot eyes */}
            <path d="M36 44 Q43 40 48 45" fill="none" stroke="#171e12" strokeWidth="2" strokeLinecap="round" />
            <path d="M70 42 Q77 40 84 42" fill="none" stroke="#171e12" strokeWidth="2" strokeLinecap="round" />
            <circle cx="43" cy="53" r="4.5" fill="#171e12" />
            <circle cx="77" cy="53" r="4.5" fill="#171e12" />
          </>
        );
      case 'smile':
      default:
        return (
          <>
            <path d="M38 53 Q43 49 48 53" fill="none" stroke="#171e12" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M72 53 Q77 49 82 53" fill="none" stroke="#171e12" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <motion.div
      className={`inline-block select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      whileHover="hover"
    >
      <motion.svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        variants={containerVariants}
        animate={currentVariant}
      >
        {/* Soft background circle */}
        <circle cx="60" cy="60" r="50" fill="#f4fce8" stroke="rgba(88, 204, 2, 0.15)" strokeWidth="1.5" />

        {/* Fox Ears (with independent hover animations) */}
        {/* Left Ear */}
        <g style={{ transformOrigin: '37px 40px' }}>
          <motion.path
            d="M30 45 L15 15 L45 35 Z"
            fill="#ff9600"
            variants={leftEarVariants}
          />
          <motion.path
            d="M30 45 L22 23 L40 38 Z"
            fill="#ffc800"
            variants={leftEarVariants}
          />
        </g>
        
        {/* Right Ear */}
        <g style={{ transformOrigin: '83px 40px' }}>
          <motion.path
            d="M90 45 L105 15 L75 35 Z"
            fill="#ff9600"
            variants={rightEarVariants}
          />
          <motion.path
            d="M90 45 L98 23 L80 38 Z"
            fill="#ffc800"
            variants={rightEarVariants}
          />
        </g>

        {/* Fox Face Base */}
        <path d="M20 50 Q60 20 100 50 Q105 75 90 90 Q60 110 30 90 Q15 75 20 50 Z" fill="#ff9600" />
        
        {/* White Cheeks */}
        <path d="M20 50 Q40 70 60 70 Q80 70 100 50 Q103 68 90 85 Q60 100 30 85 Q17 68 20 50 Z" fill="#ffffff" />
        
        {/* Nose Area */}
        <path d="M50 65 Q60 62 70 65 L60 85 Z" fill="#cc7000" />
        <polygon points="56,80 64,80 60,86" fill="#171e12" />

        {/* Scholar Glasses & Eyes (Blinks together) */}
        <motion.g 
          variants={glassesBlinkVariants} 
          animate={animated && !isTyping ? 'animate' : ''}
          style={{ transformOrigin: '60px 53px' }}
        >
          {/* Spectacles frame */}
          <circle cx="43" cy="53" r="13" fill="none" stroke="#171e12" strokeWidth="3" />
          <circle cx="77" cy="53" r="13" fill="none" stroke="#171e12" strokeWidth="3" />
          <line x1="56" y1="53" x2="64" y2="53" stroke="#171e12" strokeWidth="3" />
          
          {/* Eyeballs/Lashes */}
          {renderEyes()}
        </motion.g>

        {/* Graduation Cap overlay in primary green */}
        <polygon points="60,8 85,18 60,28 35,18" fill="#46a302" />
        <rect x="57" y="22" width="6" height="10" fill="#46a302" />
        <path d="M35 18 L35 30" stroke="#ffc800" strokeWidth="2.5" />
      </motion.svg>
    </motion.div>
  );
};
