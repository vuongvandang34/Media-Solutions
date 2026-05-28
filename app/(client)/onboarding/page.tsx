import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  await requireAuth();
  // Redirect to main workspace for Phase 1
  redirect('/dashboard');
}
