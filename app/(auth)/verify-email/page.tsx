import VerifyEmailNotice from '@/components/auth/VerifyEmailNotice';

export const metadata = {
  title: 'Verify Email | Business Feedback CRM',
  description: 'Activate your multi-tenant feedback account.',
};

interface VerifyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === 'string' ? resolvedParams.token : '';
  return <VerifyEmailNotice token={token || null} />;
}

