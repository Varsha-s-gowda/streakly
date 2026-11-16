import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Input } from '../components/ui/Field.jsx';
import { Button } from '../components/ui/Button.jsx';

const timezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    timezone,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        timezone: form.timezone,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your space"
      subtitle="Your full 8 AM–midnight routine is prepared automatically. All you have to do is begin."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sage-700 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Your name"
          autoComplete="name"
          placeholder="What should we call you?"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-[34px] rounded p-1 text-ink-muted transition hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat it"
            value={form.confirm}
            onChange={(event) => setForm({ ...form, confirm: event.target.value })}
          />
        </div>

        <Input
          label="Timezone"
          value={form.timezone}
          onChange={(event) => setForm({ ...form, timezone: event.target.value })}
          hint="Dates and streaks follow your local day. You can change this in Settings."
        />

        {error ? (
          <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs leading-relaxed text-[#834932]">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {!loading ? <Sparkles size={15} /> : null}
          {loading ? 'Preparing your routine…' : 'Begin the first day'}
        </Button>
      </form>
    </AuthLayout>
  );
}
