import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TurnstileCaptcha from '../components/ui/TurnstileCaptcha';

const Login = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [twoFAUserId, setTwoFAUserId] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const { login, verifyLogin2FA } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) return setError('All fields are required');

    if (process.env.REACT_APP_TURNSTILE_SITE_KEY && !turnstileToken) {
      setCaptchaError('Please complete captcha verification');
      return;
    }

    setLoading(true);
    setCaptchaError('');
    try {
      const data = await login(email, password, turnstileToken);
      if (data.requires2FA) {
        setTwoFAUserId(data.userId);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!twoFACode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await verifyLogin2FA(twoFAUserId, twoFACode.trim());
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
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
          <h1 className="font-display text-2xl font-bold text-jolshaa-on-surface">{t('login.title')}</h1>
          <p className="text-sm text-jolshaa-on-surface-variant mt-1">{t('login.subtitle')}</p>
        </div>

        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {twoFAUserId ? (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <p className="text-sm text-jolshaa-on-surface-variant">
                Enter the 6-digit code from your authenticator app, or a backup code.
              </p>
              <Input
                type="text"
                name="twoFACode"
                placeholder="Authentication code"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                autoFocus
              />
              <Button type="submit" fullWidth loading={loading} size="lg">
                Verify
              </Button>
              <button
                type="button"
                onClick={() => { setTwoFAUserId(null); setTwoFACode(''); }}
                className="w-full text-center text-xs text-jolshaa-on-surface-variant hover:underline"
              >
                Back to login
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder={t('login.email')}
              value={formData.email}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              }
            />
            <Input
              type="password"
              name="password"
              placeholder={t('login.password')}
              value={formData.password}
              onChange={handleChange}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              }
            />
            {process.env.REACT_APP_TURNSTILE_SITE_KEY && (
              <div className="space-y-2">
                <TurnstileCaptcha onTokenChange={setTurnstileToken} onErrorChange={setCaptchaError} />
                {captchaError && <p className="text-xs text-red-600">{captchaError}</p>}
              </div>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('login.submit')}
            </Button>
            <Link to="/forgot-password" className="block text-center text-xs text-jolshaa-on-surface-variant hover:text-jolshaa-teal transition-colors">
              {t('login.forgotPassword')}
            </Link>
          </form>
          )}
        </div>

        <p className="text-center text-sm text-jolshaa-on-surface-variant">
          {t('login.noAccount')}{' '}
          <Link to="/signup" className="text-jolshaa-teal hover:text-jolshaa-teal-container font-medium">{t('login.signup')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
