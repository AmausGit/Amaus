"use client";

import { use, useEffect, useState } from "react";
import ProtocolForm from "@/components/ProtocolForm";
import { Protocol } from "@/lib/types";

export default function EditProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/protocols/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Protocol not found.");
        return r.json();
      })
      .then((data) => setProtocol(data.protocol))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!protocol) return <p className="text-slate-400 text-sm">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">Edit Protocol</h1>
      <p className="text-sm text-slate-500 mb-6">{protocol.name}</p>
      <ProtocolForm existing={protocol} />
    </div>
  );
}
