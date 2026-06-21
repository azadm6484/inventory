"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Trash2, RefreshCw, Loader2 } from "lucide-react";

interface ImageUploadProps {
  name?: string;
  defaultValue?: string;
  label?: string;
}

export function ImageUpload({
  name = "image",
  defaultValue = "",
  label = "Product Image",
}: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUrl(data.url);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUrl("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const inputId = React.useId();

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-bold text-slate-600 uppercase">{label}</label>
      <input type="hidden" name={name} value={url} />
      <input
        id={inputId}
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500/50 rounded-2xl p-4 bg-slate-50/50 transition flex flex-col items-center justify-center min-h-[140px]">
        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-slate-500">Uploading to Cloudinary...</span>
          </div>
        ) : url ? (
          <div className="relative w-full flex items-center justify-center gap-6">
            <div className="relative w-24 h-24 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preview" className="object-cover w-full h-full" />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReplaceClick}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Replace Image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg px-3 py-2 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Image
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4 space-y-2">
            <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 group-hover:text-blue-500 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-500">Upload a file</span>
              <span className="text-xs text-slate-500"> or drag and drop</span>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, GIF or WEBP up to 5MB</p>
            </div>
          </label>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-600 animate-pulse">{error}</p>
      )}
    </div>
  );
}
