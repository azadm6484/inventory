"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
}

export function SubmitButton({ 
  children, 
  loadingText = "Processing...", 
  className = "", 
  ...props 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={`relative inline-flex items-center justify-center gap-2 transition disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {pending && (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      )}
      <span>{pending ? loadingText : children}</span>
    </button>
  );
}
