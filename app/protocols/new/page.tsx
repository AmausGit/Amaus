import ProtocolForm from "@/components/ProtocolForm";

export default function NewProtocolPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">Start a New Protocol</h1>
      <p className="text-sm text-slate-500 mb-6">
        Record the details once — you&apos;ll only log quick daily check-ins after this.
      </p>
      <ProtocolForm />
    </div>
  );
}
