import { useState } from 'react';
import { Send } from 'lucide-react';
import { profile } from '@/content/profile';
import { track } from '@/lib/analytics';

type State = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited';

export default function ContactForm() {
  const [state, setState] = useState<State>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`MotionStudio contact from ${form.name || 'someone'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (data?.fallback) {
          track.contactFormSubmitted('mailto_fallback');
          mailtoFallback();
          setState('idle');
        } else {
          track.contactFormSubmitted('resend');
          setState('sent');
          setForm({ name: '', email: '', message: '' });
        }
      } else if (res.status === 429) {
        setState('rate-limited');
      } else {
        setState('error');
      }
    } catch {
      track.contactFormSubmitted('mailto_fallback_error');
      mailtoFallback();
      setState('idle');
    }
  };

  const inputCls =
    'w-full rounded-studio-md border border-studio-border bg-studio-panel px-4 py-3 text-[13px] text-studio-text placeholder:text-studio-text-faint outline-none transition-colors focus:border-studio-accent';

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className={inputCls}
          placeholder="Your name"
          value={form.name}
          onChange={update('name')}
          required
        />
        <input
          className={inputCls}
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={update('email')}
          required
        />
      </div>
      <textarea
        className={`${inputCls} min-h-[130px] resize-y`}
        placeholder="What's on your mind?"
        value={form.message}
        onChange={update('message')}
        required
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover text-white text-[14px] font-medium transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Sent ✓' : (
          <>
            Send message
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
      {state === 'sent' && (
        <p className="text-center text-[12px] text-studio-accent">Thanks — I&apos;ll get back to you soon.</p>
      )}
      {state === 'rate-limited' && (
        <p className="text-center text-[12px] text-red-400">
          Too many attempts. Please wait 15 minutes before trying again.
        </p>
      )}
      {state === 'error' && (
        <p className="text-center text-[12px] text-red-400">
          Something went wrong.{' '}
          <button type="button" onClick={mailtoFallback} className="underline">
            Email me directly instead.
          </button>
        </p>
      )}
    </form>
  );
}
