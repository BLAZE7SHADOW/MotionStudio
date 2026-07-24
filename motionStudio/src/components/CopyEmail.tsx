import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import posthog from 'posthog-js';

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(email).then(() => {
      posthog.capture('email_copied');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy email"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-studio-border bg-studio-panel text-[13px] font-medium text-studio-text-secondary transition-all hover:-translate-y-0.5 hover:border-studio-accent hover:text-studio-text"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {email}
    </button>
  );
}
