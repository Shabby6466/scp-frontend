'use client';

import { motion } from 'framer-motion';

interface ComplianceScoreDialProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ComplianceScoreDial({ 
  score, 
  size = 120, 
  strokeWidth = 10 
}: ComplianceScoreDialProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 80) return 'stroke-emerald-500';
    if (s >= 50) return 'stroke-amber-500';
    return 'stroke-destructive';
  };

  return (
    <div className="relative flex items-center justify-center translate-y-2" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/10"
        />
        {/* Progress stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className={getStrokeColor(score)}
          style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-2xl font-bold tracking-tighter ${getColor(score)}`}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Health
        </span>
      </div>
    </div>
  );
}
