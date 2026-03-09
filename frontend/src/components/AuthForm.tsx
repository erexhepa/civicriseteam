import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { Flame } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

type AuthFormVariant = 'signin' | 'signup';

interface AuthFormProps {
  variant: AuthFormVariant;
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSignUp?: (name: string, email: string, password: string, zipCode: string) => Promise<void>;
  onSuccess?: () => void;
}

export function AuthForm({ variant, onSignIn, onSignUp, onSuccess }: AuthFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignIn = variant === 'signin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignIn) {
        if (!onSignIn) throw new Error('Sign In handler not provided');
        await onSignIn(email, password);
      } else {
        if (!onSignUp) throw new Error('Sign Up handler not provided');
        if (!name.trim()) throw new Error('Name is required');
        if (!zipCode.trim()) throw new Error('ZIP Code is required');
        await onSignUp(name.trim(), email.trim(), password, zipCode.trim());
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-civic-card p-8 shadow-xl">
      <div className="mb-8 flex justify-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-orange text-white">
            <Flame className="h-6 w-6" />
          </span>
          <span className="text-civic-orange">CIVICRISE</span>
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">
        {isSignIn ? 'Sign In' : 'Create an Account'}
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isSignIn && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-600 bg-civic-navy px-4 py-2 text-white placeholder-gray-500 focus:border-civic-orange focus:outline-none focus:ring-1 focus:ring-civic-orange"
              placeholder="Full Name"
              required={!isSignIn}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-600 bg-civic-navy px-4 py-2 text-white placeholder-gray-500 focus:border-civic-orange focus:outline-none focus:ring-1 focus:ring-civic-orange"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-civic-navy px-4 py-2 pr-10 text-white placeholder-gray-500 focus:border-civic-orange focus:outline-none focus:ring-1 focus:ring-civic-orange"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {!isSignIn && (
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300">
              ZIP Code
            </label>
            <input
              id="zipCode"
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-600 bg-civic-navy px-4 py-2 text-white placeholder-gray-500 focus:border-civic-orange focus:outline-none focus:ring-1 focus:ring-civic-orange"
              placeholder="36104"
              required={!isSignIn}
            />
          </div>
        )}
        {isSignIn && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-600 bg-civic-navy text-civic-orange focus:ring-civic-orange"
              />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>
            <a href="#" className="text-sm text-civic-orange hover:underline">
              Forgot password?
            </a>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-civic-orange py-2.5 font-medium text-white hover:bg-civic-orange-hover disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        {isSignIn ? (
          <>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-civic-orange hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/signin" className="text-civic-orange hover:underline">
              Sign In
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
