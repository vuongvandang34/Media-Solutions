import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password | Business Feedback CRM',
  description: 'Request a password recovery link.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
