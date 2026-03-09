import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Navbar } from '../components';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-civic-navy">
      <Navbar />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
        <AuthForm
          variant="signup"
          onSignUp={signUp}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
}

export const Route = createFileRoute('/signup')({
  head: () => ({
    meta: [{ title: 'Sign Up – CivicRise' }],
  }),
  component: SignUpPage,
});
