import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('role', res.data.user.role);

            if (res.data.user.role === 'admin') navigate('/admin');
            else navigate('/');
        } catch (err: any) {
            if (!err.response) {
                setError(t('common.networkError') || 'Sunucuya bağlanılamadı. Backend çalışmıyor olabilir.');
            } else {
                setError(err.response?.data?.message || t('login.invalidCredentials'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
            <div className="w-full max-w-sm p-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-16 w-auto object-contain" />
                    <button onClick={() => navigate('/settings')} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-lg hover:bg-[var(--color-surface-hover)]" title={t('common.settings')}>
                        <Settings size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('common.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="admin@pratikbulut.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('common.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-[var(--color-text)] text-[var(--color-background)] hover:bg-gray-200 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : t('login.signIn')}
                    </button>
                </form>
            </div>
        </div>
    );
}
