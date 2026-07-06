import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TurnstileCaptcha from '../components/ui/TurnstileCaptcha';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;
    if (!name || !email || !password) return setError('All fields are required');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    if (process.env.REACT_APP_TURNSTILE_SITE_KEY && !turnstileToken) {
      setCaptchaError('Please complete captcha verification');
      return;
    }

    setLoading(true);
    setCaptchaError('');
    try {
      await signup(name, email, password, turnstileToken);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-jolshaa-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-jolshaa-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">J</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-jolshaa-on-surface">Create Account</h1>
          <p className="text-sm text-jolshaa-on-surface-variant mt-1">Join Jolshaa today</p>
        </div>

        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
            />
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              }
            />
            <Input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              }
            />
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
            />
            {process.env.REACT_APP_TURNSTILE_SITE_KEY && (
              <div className="space-y-2">
                <TurnstileCaptcha onTokenChange={setTurnstileToken} onErrorChange={setCaptchaError} />
                {captchaError && <p className="text-xs text-red-600">{captchaError}</p>}
              </div>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign Up
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-jolshaa-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-jolshaa-teal hover:text-jolshaa-teal-container font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
