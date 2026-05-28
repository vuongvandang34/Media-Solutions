import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password | Business Feedback CRM',
  description: 'Set a new password for your account.',
};

interface ResetPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === 'string' ? resolvedParams.token : '';
  return <ResetPasswordForm token={token} />;
}

