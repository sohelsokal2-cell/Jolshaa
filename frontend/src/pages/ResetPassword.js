import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPassword = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = formData;

    if (!newPassword || !confirmPassword) return setError(t('resetPassword.allFieldsRequired'));
    if (newPassword.length < 8) return setError(t('resetPassword.passwordTooShort'));
    if (newPassword !== confirmPassword) return setError(t('resetPassword.passwordsMismatch'));

    setLoading(true);
    setError('');
    try {
      await axios.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-jolshaa-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-jolshaa-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">J</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-jolshaa-on-surface">{t('resetPassword.invalidLink')}</h1>
            <p className="text-sm text-jolshaa-on-surface-variant mt-1">{t('resetPassword.invalidLinkDesc')}</p>
          </div>
          <p className="text-center text-sm text-jolshaa-on-surface-variant">
            <Link to="/forgot-password" className="text-jolshaa-teal hover:text-jolshaa-teal-container font-medium">
              {t('resetPassword.requestNewLink')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jolshaa-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-jolshaa-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">J</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-jolshaa-on-surface">{t('resetPassword.title')}</h1>
          <p className="text-sm text-jolshaa-on-surface-variant mt-1">{t('resetPassword.subtitle')}</p>
        </div>

        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm text-jolshaa-on-surface">{t('resetPassword.success')}</p>
              <p className="text-xs text-jolshaa-on-surface-variant">{t('resetPassword.redirecting')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                name="newPassword"
                placeholder={t('resetPassword.newPassword')}
                value={formData.newPassword}
                onChange={handleChange}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                }
              />
              <Input
                type="password"
                name="confirmPassword"
                placeholder={t('resetPassword.confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }
              />
              <Button type="submit" fullWidth loading={loading} size="lg">
                {t('resetPassword.submit')}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-jolshaa-on-surface-variant">
          <Link to="/login" className="text-jolshaa-teal hover:text-jolshaa-teal-container font-medium">
            {t('resetPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
