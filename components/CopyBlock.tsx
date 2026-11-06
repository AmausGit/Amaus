"use client";

import { useState } from "react";

export default function CopyBlock({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
      >
        {copied ? "Copied" : label}
      </button>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 pr-20 text-xs leading-relaxed text-slate-800">
        {text}
      </pre>
    </div>
  );
}
