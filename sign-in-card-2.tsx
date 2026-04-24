"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";

type SignInCard2Props = {
  className?: string;
  error?: string;
  isLoading?: boolean;
  onSubmit?: (values: { email: string; password: string }) => void | Promise<void>;
  onForgotPassword?: () => void;
};

export default function SignInCard2({
  className = "",
  error,
  isLoading = false,
  onSubmit,
  onForgotPassword,
}: SignInCard2Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loading = isLoading || isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSubmit || loading) return;

    try {
      setIsSubmitting(true);
      await onSubmit({ email: email.trim(), password });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[linear-gradient(180deg,#f5f7fb_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 ${className}`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-9">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.06 }}
              className="mb-8 text-center"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">
                GETXH
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to GETXH
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-medium text-blue-600 transition duration-200 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={loading ? undefined : { scale: 1.015 }}
                whileTap={loading ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2 }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition duration-200 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{loading ? "Signing In..." : "Sign In"}</span>
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
