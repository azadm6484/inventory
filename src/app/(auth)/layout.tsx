import React from "react";

function InventoryIllustration() {
  return (
    <svg
      viewBox="0 0 600 520"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-md"
    >
      <defs>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
      </defs>

      <circle cx="500" cy="80" r="90" fill="#38BDF8" opacity="0.15" />
      <circle cx="60" cy="440" r="110" fill="#2563EB" opacity="0.12" />

      <g transform="translate(120,60)">
        <polygon points="0,80 220,0 380,70 160,150" fill="url(#screenGrad)" />
        <polygon points="0,80 0,330 160,400 160,150" fill="#1E3A8A" />
        <polygon points="160,150 160,400 380,330 380,70" fill="#2563EB" />

        <g transform="translate(20,120)">
          <rect width="150" height="90" rx="10" fill="url(#cardGrad)" />
          <rect x="16" y="18" width="118" height="10" rx="5" fill="#FFFFFF" opacity="0.9" />
          <rect x="16" y="40" width="90" height="10" rx="5" fill="#FFFFFF" opacity="0.7" />
          <rect x="16" y="62" width="105" height="10" rx="5" fill="#FFFFFF" opacity="0.7" />
        </g>

        <g transform="translate(255,40)">
          <rect width="90" height="90" rx="10" fill="url(#panelGrad)" />
          <polygon points="20,65 38,40 55,58 70,35 80,65" fill="#FFFFFF" opacity="0.85" />
          <circle cx="30" cy="28" r="8" fill="#FFFFFF" opacity="0.9" />
        </g>

        <g transform="translate(255,150)">
          <rect width="90" height="90" rx="10" fill="#BFDBFE" />
          <text x="45" y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1E40AF" fontFamily="monospace">
            {"</>"}
          </text>
        </g>

        <g transform="translate(20,230)">
          <rect width="200" height="110" rx="10" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#60A5FA" strokeWidth="4" />
          <line x1="42" y1="42" x2="52" y2="52" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
          <rect x="20" y="62" width="160" height="9" rx="4.5" fill="#DBEAFE" />
          <rect x="20" y="82" width="120" height="9" rx="4.5" fill="#DBEAFE" />
        </g>

        <g transform="translate(330,10)" fill="#FBBF24">
          <circle cx="10" cy="10" r="11" />
          <circle cx="10" cy="10" r="4" fill="#92400E" />
        </g>
        <g transform="translate(8,230)" fill="#34D399">
          <circle cx="10" cy="10" r="11" />
          <circle cx="10" cy="10" r="4" fill="#065F46" />
        </g>
      </g>

      <g transform="translate(255,300)">
        <ellipse cx="60" cy="220" rx="55" ry="12" fill="#000000" opacity="0.08" />
        <rect x="40" y="60" width="40" height="100" rx="16" fill="#2563EB" />
        <circle cx="60" cy="34" r="26" fill="#BFDBFE" />
        <rect x="20" y="150" width="20" height="70" rx="8" fill="#1E3A8A" />
        <rect x="80" y="150" width="20" height="70" rx="8" fill="#1E3A8A" />
        <rect x="10" y="65" width="55" height="16" rx="8" fill="#3B82F6" transform="rotate(-18 10 65)" />
      </g>

      <polygon points="80,320 105,365 55,365" fill="#38BDF8" opacity="0.5" />
      <polygon points="480,360 505,400 455,400" fill="#60A5FA" opacity="0.5" />
    </svg>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center"
      style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)" }}
    >
      {/* Illustration spans the full page, anchored right so it doesn't fight the card */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <div className="max-w-2xl w-full pr-10 lg:pr-24 opacity-90">
          <InventoryIllustration />
        </div>
      </div>

      {/* Headline content, sits in the open space above/around the illustration */}
      <div className="absolute top-12 right-10 lg:right-24 max-w-sm text-right hidden lg:block">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          Inventory, simplified
        </h2>
        <p className="text-sm text-slate-600">
          Track stock, manage suppliers and stay on top of every order
          from one dashboard.
        </p>
      </div>

      {/* Floating login/signup card, left side */}
      <div className="relative z-10 w-full md:w-[45%] flex items-center justify-center px-6 lg:px-16 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="mb-8">
            <img
              src="/inventory.png"
              alt="Inventory Logo"
              className="w-10 h-10 object-contain mb-6"
            />
            <h1 className="text-2xl font-semibold text-slate-900">
              Enterprise Inventory
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage products, stock, suppliers and orders.
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}