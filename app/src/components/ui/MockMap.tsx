'use client';

import { motion } from 'framer-motion';

export function MockMap() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-background">
      {/* Subtle Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen pointer-events-none">
        <svg viewBox="0 0 1000 600" className="w-full h-full min-w-[800px] max-w-7xl">
          {/* Subtle connecting lines */}
          <motion.path
            d="M200,400 Q400,200 600,300 T900,100"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            className="opacity-20"
          />
          <motion.path
            d="M100,500 Q300,550 500,400 T800,450"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            className="opacity-20"
          />

          {/* Animated Route Line */}
          <motion.path
            d="M300,450 Q500,250 650,350 T850,200"
            fill="none"
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
            strokeDasharray="10 10"
            className="animate-route-trace opacity-40"
          />

          {/* Data Nodes */}
          {[
            { cx: 300, cy: 450, r: 2 },
            { cx: 500, cy: 250, r: 2 },
            { cx: 650, cy: 350, r: 2 },
            { cx: 850, cy: 200, r: 2 },
            { cx: 200, cy: 400, r: 1.5 },
            { cx: 600, cy: 300, r: 1.5 },
            { cx: 900, cy: 100, r: 1.5 },
          ].map((node, i) => (
            <motion.circle
              key={i}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="var(--text-secondary)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
            />
          ))}

          {/* Main User Node - Subtle Sky Blue Accent */}
          <motion.circle
            cx="500" cy="300" r="3" fill="var(--accent)"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          <motion.circle
            cx="500" cy="300" r="10"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="0.5"
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </div>
  );
}
