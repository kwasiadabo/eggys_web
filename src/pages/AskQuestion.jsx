import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatDate } from '../lib/format';

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
};

export default function AskQuestion() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);

  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ question: '' });
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const loadQuestions = () => api.get('/questions').then((res) => setQuestions(res.data)).catch(() => {});

  useEffect(() => {
    if (user) loadQuestions();
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setJustSubmitted(false);
    if (!form.question.trim()) return setError('Please enter your question');
    if (!user && (!guest.name.trim() || !guest.email.trim())) {
      return setError('Please enter your name and email so we can send you the answer');
    }
    setSubmitting(true);
    try {
      await api.post('/questions', {
        question: form.question.trim(),
        ...(!user && {
          guestName: guest.name.trim(),
          guestEmail: guest.email.trim(),
          guestPhone: guest.phone.trim() || undefined,
        }),
      });
      setForm({ question: '' });
      if (user) {
        showToast("Question submitted — we'll get back to you soon");
        loadQuestions();
      } else {
        showToast("Question submitted — we'll email your answer");
        setJustSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-green';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

  return (
    <div className="w-full mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Ask a Question</h1>
      <p className="mt-2 text-sm text-black/50">
        Have a question about our eggs, delivery, or anything else? Send it over and our team will get back to
        you by email.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3 bg-white border border-black/5 rounded-lg p-5">
        {!user && (
          <div className="border border-black/5 rounded-lg p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-green">Contact Details</p>
            <label className={labelClass}>Full name *
              <input
                required
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Email *
                <input
                  required
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>Phone
                <input
                  type="tel"
                  value={guest.phone}
                  onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-xs text-black/40">
              We'll email your answer to this address.
            </p>
          </div>
        )}
        <label className={labelClass}>Your question *
          <textarea
            required
            rows={4}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="What would you like to know?"
            className={inputClass}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-green transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Question'}
        </button>
      </form>

      {user ? (
        <>
          <h2 className="font-display text-2xl mt-10">My Questions</h2>
          {questions.length ? (
            <div className="mt-4 space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="bg-white border border-black/5 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-black/40">{formatDate(q.createdAt)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[q.status] || ''}`}>
                      {q.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-black/70">{q.question}</p>
                  {q.answer && (
                    <div className="mt-3 pl-3 border-l-2 border-green">
                      <p className="text-xs uppercase tracking-[0.2em] text-green">Our Response</p>
                      <p className="mt-1 text-sm text-black/70">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-black/40 text-sm">No questions asked yet.</p>
          )}
        </>
      ) : justSubmitted ? (
        <p className="mt-8 text-sm text-black/50">
          Thanks — we'll email your answer to <span className="text-black/70">{guest.email}</span>.
        </p>
      ) : null}
    </div>
  );
}
