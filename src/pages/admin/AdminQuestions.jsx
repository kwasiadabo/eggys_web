import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { formatDate } from '../../lib/format';

const STATUSES = ['open', 'answered'];

const badge = {
  open: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
};

export default function AdminQuestions() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // questionId -> answer text being composed
  const [saving, setSaving] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    api.get('/admin/questions', { params })
      .then((res) => setQuestions(res.data))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user?.isAdmin) return navigate('/');
    load();
  }, [user, navigate, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.isAdmin) return null;

  const respond = async (question, status) => {
    setSaving(question.id);
    try {
      await api.patch(`/admin/questions/${question.id}`, {
        answer: drafts[question.id] ?? undefined,
        status,
      });
      setDrafts((d) => ({ ...d, [question.id]: '' }));
      showToast('Question updated');
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update question', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-4xl">Questions</h1>
        <label className="flex flex-col gap-1 text-xs font-medium text-black/60">Status
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-black/15 bg-white text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-black/40">Loading questions…</p>
      ) : questions.length ? (
        <div className="mt-8 space-y-4">
          {questions.map((question) => {
            const name = question.User
              ? `${question.User.firstName || ''} ${question.User.lastName || ''}`.trim()
              : question.guestName;
            const contact = question.User
              ? question.User.phoneNumber || question.User.email
              : question.guestEmail || question.guestPhone;
            return (
              <div key={question.id} className="bg-white border border-black/5 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">{name || 'Anonymous'}</span>
                    {!question.User && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-black/5 text-black/50">Guest</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${badge[question.status] || ''}`}>
                    {question.status}
                  </span>
                </div>
                <p className="text-xs text-black/40 mt-1">
                  {contact} · {formatDate(question.createdAt)}
                </p>
                <p className="mt-2 text-sm text-black/70">{question.question}</p>

                {question.answer && (
                  <div className="mt-3 pl-3 border-l-2 border-green">
                    <p className="text-xs uppercase tracking-[0.2em] text-green">Our Response</p>
                    <p className="mt-1 text-sm text-black/70">{question.answer}</p>
                  </div>
                )}

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <textarea
                    rows={2}
                    value={drafts[question.id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [question.id]: e.target.value }))}
                    placeholder="Write an answer…"
                    className="flex-1 px-3 py-2 border border-black/15 rounded-lg bg-white text-sm focus:outline-none focus:border-green"
                  />
                  <div className="flex sm:flex-col gap-2">
                    <button
                      disabled={saving === question.id}
                      onClick={() => respond(question, 'answered')}
                      className="px-4 py-2 rounded-full bg-ink text-white text-xs hover:bg-green transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Send &amp; mark answered
                    </button>
                    <select
                      value={question.status}
                      disabled={saving === question.id}
                      onChange={(e) => respond(question, e.target.value)}
                      className="px-3 py-2 rounded-full border border-black/15 bg-white text-xs disabled:opacity-40"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-12 text-center text-black/40">
          No questions{filter ? ` with status "${filter}"` : ''}.
        </p>
      )}
    </div>
  );
}
