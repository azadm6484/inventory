"use client";

import React, { useActionState } from "react";
import { registerUser } from "@/actions/authActions";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          {state.success}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          placeholder="John Doe"
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="john.doe@example.com"
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          placeholder="••••••••"
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl py-3 text-sm shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition flex items-center justify-center gap-2 outline-none"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating Account...
          </>
        ) : (
          "Register"
        )}
      </button>

      <div className="text-center text-xs text-slate-500 pt-2">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-bold transition">
          Sign In
        </Link>
      </div>
    </form>
  );
}
