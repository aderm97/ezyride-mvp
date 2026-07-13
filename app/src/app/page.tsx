import { redirect } from 'next/navigation';

// "/" is served by the bespoke static landing in /public/landing via a
// beforeFiles rewrite in next.config.ts, so this route is normally never hit.
// This redirect is only a fallback in case the rewrite is ever bypassed.
export default function Home() {
  redirect('/landing');
}
