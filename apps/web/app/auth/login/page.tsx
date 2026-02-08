"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OAuthButtons from '../../../components/OAuthButtons';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh to ensure cookies are picked up by middleware
        router.refresh();
        router.push('/dashboard');
      } else if (data.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(data.email);
        setError(data.error);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      if (res.ok) {
        setResendSuccess(true);
      }
    } catch (err) {
      console.error('Resend error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left: Form Section */}
      <div className="flex w-full flex-col justify-center px-4 py-12 md:px-12 lg:w-1/2 lg:px-20 xl:px-24 z-10 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo Placeholder */}
            <div className="mb-10 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg">S</div>
                <span className="text-xl font-bold tracking-tight text-gray-900">SharePay</span>
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Welcome back</h1>
                <p className="mt-3 text-base text-gray-500">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Sign up for free
                    </Link>
                </p>
            </div>

            <div className="mt-8">
                <OAuthButtons />

                <div className="relative mt-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm font-medium leading-6">
                        <span className="bg-white px-4 text-gray-500">Or continue with email</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 sm:text-sm transition-colors duration-200"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <Link href="/auth/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 sm:text-sm transition-colors duration-200"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                    {needsVerification && (
                                        <div className="mt-4">
                                            {resendSuccess ? (
                                                <p className="text-sm font-medium text-green-600">Verification email sent! Check your inbox.</p>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendVerification}
                                                    disabled={resendLoading}
                                                    className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                >
                                                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
                    >
                        {loading ? <LoadingSpinner size="sm" color="white" /> : 'Sign in to account'}
                    </button>
                </form>
            </div>
        </div>
      </div>

      {/* Right: Feature Section */}
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        
        {/* Animated Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse delay-700"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse delay-1000"></div>

        {/* Content Overlay */}
        <div className="relative z-10 flex h-full flex-col justify-center px-16 text-white">
            <div className="max-w-xl">
                 <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6 leading-tight">
                    Smart logic for <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                        shared expenses.
                    </span>
                 </h2>
                 <p className="mt-4 text-lg text-indigo-100 leading-relaxed opacity-90">
                    Stop worrying about who owes what. Track balances, scan receipts with AI, and settle up instantly.
                 </p>
                 
                 {/* Abstract Card Visual using CSS */}
                 <div className="mt-12 relative w-full aspect-[16/9] max-w-lg bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 ease-out flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div className="flex gap-2">
                             <div className="h-3 w-3 rounded-full bg-red-400"></div>
                             <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                             <div className="h-3 w-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="flex-1 py-6 flex items-end gap-3 px-2">
                         <div className="w-full bg-indigo-500/20 rounded-t-sm h-[40%]"></div>
                         <div className="w-full bg-indigo-500/40 rounded-t-sm h-[70%]"></div>
                         <div className="w-full bg-indigo-500/60 rounded-t-sm h-[50%]"></div>
                         <div className="w-full bg-indigo-500/80 rounded-t-sm h-[85%]"></div>
                         <div className="w-full bg-indigo-500 rounded-t-sm h-[60%]"></div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="h-2 w-32 bg-white/20 rounded-full"></div>
                        <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium border border-green-500/20">
                            + $1,240.50
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
