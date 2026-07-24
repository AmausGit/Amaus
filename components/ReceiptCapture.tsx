"use client";

import { useState } from "react";
import { Protocol } from "@/lib/types";
import { parseReceiptText } from "@/lib/receipt-parse";

export default function ReceiptCapture({
  protocol,
  onSaved,
}: {
  protocol: Protocol;
  onSaved: (p: Protocol) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [date, setDate] = useState(protocol.receipt_date ?? "");
  const [amount, setAmount] = useState(protocol.receipt_amount ?? "");
  const [store, setStore] = useState(protocol.receipt_store ?? "");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
    setScanning(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(f);
      await worker.terminate();
      setOcrText(text);
      const parsed = parseReceiptText(text);
      if (parsed.date) setDate(parsed.date);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.store) setStore(parsed.store);
    } catch {
      setError(
        "Text recognition couldn't run (requires internet access in your browser on first use). You can still fill in the fields manually and save the photo."
      );
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!file) {
      setError("Choose a receipt photo first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("receipt", file);
      form.append("ocr_text", ocrText);
      form.append("receipt_date", date);
      form.append("receipt_amount", amount);
      form.append("receipt_store", store);
      const res = await fetch(`/api/protocols/${protocol.id}/receipt-upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save receipt.");
      }
      const data = await res.json();
      onSaved(data.protocol);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {protocol.receipt_image_path && !previewUrl && (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={protocol.receipt_image_path}
            alt="Saved receipt"
            className="h-24 w-24 rounded-md border border-slate-200 object-cover"
          />
          <div className="text-xs text-slate-500 space-y-0.5">
            {protocol.receipt_date && <p>Date: {protocol.receipt_date}</p>}
            {protocol.receipt_amount && <p>Amount: ${protocol.receipt_amount}</p>}
            {protocol.receipt_store && <p>Store: {protocol.receipt_store}</p>}
          </div>
        </div>
      )}

      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">
          {protocol.receipt_image_path ? "Replace receipt photo" : "Scan a receipt photo"}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="text-sm"
        />
      </label>

      {previewUrl && (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Receipt preview" className="h-24 w-24 rounded-md border border-slate-200 object-cover" />
          <div className="flex-1 space-y-2">
            {scanning && <p className="text-xs text-slate-400">Scanning receipt for text…</p>}
            <div className="grid grid-cols-3 gap-2">
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Store"
                value={store}
                onChange={(e) => setStore(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || scanning}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Receipt"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
