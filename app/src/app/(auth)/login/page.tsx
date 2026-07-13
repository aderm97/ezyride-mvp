'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, name, role, ...(role === 'DRIVER' ? { inviteCode } : {}) };
      const data = await fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/rider');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4 relative font-body">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="w-full max-w-md bg-card border border-border rounded-card shadow-[var(--shadow-lift)] p-10 md:p-12 z-10"
      >
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-light tracking-wider text-text-primary">
              ezy<span className="font-semibold">ride</span>
            </span>
          </div>
          <p className="text-text-secondary text-sm tracking-widest uppercase">
            {isLogin ? 'Premium rides, instantly.' : 'Join the movement.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="overflow-hidden flex flex-col gap-6"
              >
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Full Name</label>
                  <input suppressHydrationWarning
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-text-primary focus:ring-1 focus:ring-text-primary px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 rounded-field"
                    placeholder="John Astors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Join As</label>
                  <div className="flex gap-4">
                    <button suppressHydrationWarning type="button" onClick={() => setRole('RIDER')} className={`flex-1 py-3 text-sm font-semibold transition-all duration-300 rounded-field border ${role === 'RIDER' ? 'bg-text-primary text-background border-text-primary' : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'}`}>
                      Rider
                    </button>
                    <button suppressHydrationWarning type="button" onClick={() => setRole('DRIVER')} className={`flex-1 py-3 text-sm font-semibold transition-all duration-300 rounded-field border ${role === 'DRIVER' ? 'bg-text-primary text-background border-text-primary' : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'}`}>
                      Driver
                    </button>
                  </div>
                </div>

                {role === 'DRIVER' && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Driver Invite Code</label>
                    <input suppressHydrationWarning
                      type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full bg-surface border border-border focus:border-text-primary focus:ring-1 focus:ring-text-primary px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 rounded-field"
                      placeholder="Provided during chauffeur onboarding"
                    />
                    <p className="text-[10px] text-text-secondary mt-2">Chauffeur accounts require an invite code from Ezyride.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Email Address</label>
            <input suppressHydrationWarning
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border focus:border-text-primary focus:ring-1 focus:ring-text-primary px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 rounded-field"
              placeholder="hello@luxury.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Password</label>
            <input suppressHydrationWarning
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border focus:border-text-primary focus:ring-1 focus:ring-text-primary px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-secondary/50 rounded-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-xs font-semibold uppercase tracking-widest bg-rose-500/5 p-4 border border-rose-500/20 rounded-field">
              {error}
            </motion.div>
          )}

          <Button type="submit" variant="primary" isLoading={isLoading} className="mt-4 w-full py-4 text-base">
            {isLogin ? 'Sign In' : 'Begin Journey'}
          </Button>

          <div className="text-center mt-6">
            <button suppressHydrationWarning type="button" onClick={() => setIsLogin(!isLogin)} className="text-text-secondary hover:text-text-primary transition-colors text-xs tracking-widest uppercase font-semibold pb-1 border-b border-transparent hover:border-text-primary">
              {isLogin ? "Experience Ezyride. Create account." : "Already flying with us? Sign in."}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
