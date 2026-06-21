"use client";

import React, { useEffect, useState, startTransition } from "react";
import { verifyEmailToken } from "@/actions/authActions";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided.");
      setLoading(false);
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifyEmailToken(token);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(result.success || "Email verified successfully!");
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("An unexpected error occurred during email verification.");
      } finally {
        setLoading(false);
      }
    });
  }, [token, router]);

  return (
    <div className="text-center space-y-4 py-4">
      {loading ? (
        <div className="space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Verifying your email address...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-red-500/15 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✕
              </div>
              <h2 className="text-lg font-bold text-white">Verification Failed</h2>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h2 className="text-lg font-bold text-white">Verification Successful</h2>
              <p className="text-slate-400 text-sm">{success}</p>
              <p className="text-xs text-slate-500 animate-pulse">Redirecting you to login...</p>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
