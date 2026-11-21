'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold text-rose-400">System Error</h2>
          <p className="text-sm text-slate-400">An unexpected application error occurred.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
