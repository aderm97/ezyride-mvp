'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function MarketTicker() {
  const [data, setData] = useState<{ quotes: any[], news: string[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch('/api/finance');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(true);
      }
    };
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (error || !data || !data.quotes) return null;

  const allItems = [
    ...data.quotes.map(q => `${q.symbol}: $${q.price.toFixed(2)} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`),
    ...data.news
  ];

  return (
    <div className="w-full bg-background border-b border-border overflow-hidden h-8 flex items-center">
      <div className="flex whitespace-nowrap">
        <motion.div
          className="flex gap-12 px-12"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 30, repeat: Infinity }}
        >
          {/* Double the array for seamless infinite scroll */}
          {[...allItems, ...allItems].map((item, i) => (
            <span key={i} className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
              {item.includes('+') ? (
                <span className="text-accent mr-2">▲</span>
              ) : item.includes('-') && item.includes('%') ? (
                <span className="text-text-secondary mr-2">▼</span>
              ) : (
                <span className="text-text-primary mr-2">◆</span>
              )}
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
