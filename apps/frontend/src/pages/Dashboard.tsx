import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Monitor, Play, LogOut, Wrench, Settings, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

interface Session {
    id: number;
    windows_username: string;
    host: string;
    description: string;
    assignedTo?: string | null;
    tags?: { id: number; name: string; color: string | null }[];
}
const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();
    const currentRole = localStorage.getItem('role');
    const isAdminOrManager = currentRole === 'admin' || currentRole === 'manager';
    const { t } = useLanguage();
    const { theme } = useTheme();

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axios.get('/api/my-sessions', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSessions(res.data);
            } catch (e) {
                if (axios.isAxiosError(e) && e.response?.status === 401) {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const handleConnect = async (accountId: number) => {
        try {
            // 1. Generate connection token
            const res = await axios.post('/api/rdp/generate', { accountId }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const connectionToken = res.data.token;

            // 2. Trigger the custom protocol (Helper client catches this)
            // Use the API URL from environment, fallback to origin if not set
            const apiHost = import.meta.env.VITE_API_URL || window.location.origin;
            const url = `nanodata://connect?token=${connectionToken}&apiHost=${encodeURIComponent(apiHost)}`;
            window.location.href = url;
        } catch (e) {
            alert(t('dashboard.failedConnection'));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Monitor size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">{t('dashboard.assignedDesktops')}</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <Settings size={16} /> {t('common.settings')}
                        </button>
                        {isAdminOrManager && (
                            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                                <Wrench size={16} /> {currentRole === 'manager' ? t('dashboard.managementPanel') : t('dashboard.adminPanel')}
                            </button>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <LogOut size={16} /> {t('common.logout')}
                        </button>
                    </div>
                </header>

                <div className="mb-6 relative w-full md:w-1/3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-4 py-2 outline-none focus:border-[var(--color-primary)] placeholder-[var(--color-text-muted)] text-sm transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="animate-pulse flex gap-6">
                        <div className="h-40 w-1/3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"></div>
                        <div className="h-40 w-1/3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"></div>
                    </div>
                ) : (
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {sessions.filter(s => 
                            (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                            s.host.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.windows_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.assignedTo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (s.tags || []).some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map((session) => {
                            const bgImage = theme === 'dark' ? '/dwp.webp' : '/lwp.webp';
                            return (
                            <div 
                                key={session.id} 
                                className="border border-[var(--color-border)] rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/5 group flex flex-col justify-between h-full relative overflow-hidden"
                                style={{
                                    backgroundImage: `linear-gradient(to bottom, transparent 10%, var(--color-surface) 70%), url('${bgImage}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'top center',
                                    backgroundColor: 'var(--color-surface)'
                                }}
                            >
                                <div className="absolute inset-x-0 top-0 h-[2px] w-1/2 mx-auto bg-gradient-to-r from-transparent via-blue-500/0 group-hover:via-blue-500/80 to-transparent transition-all duration-500 z-20"></div>

                                <h3 className="text-lg font-medium mb-1 relative z-10">{session.description || session.host}</h3>
                                <div className="text-sm text-[var(--color-text-muted)] mb-3 flex flex-col gap-1">
                                    <span>{t('dashboard.host')}: {session.host}</span>
                                    <span>{t('common.user')}: {session.windows_username}@pratikbulut.local</span>
                                    {session.assignedTo && (
                                        <span className="mt-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded w-fit">
                                            {t('dashboard.subordinate')}: {session.assignedTo}
                                        </span>
                                    )}
                                    {session.tags && session.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {session.tags.map(tag => (
                                                <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: tag.color || '#3b82f6', color: getContrastYIQ(tag.color || '#3b82f6') }}>
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleConnect(session.id)}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white font-medium py-2.5 rounded-lg transition-all duration-200 relative z-10"
                                >
                                    <Play size={16} className="fill-current" /> {t('dashboard.connect')}
                                </button>
                            </div>
                        )})}

                        {sessions.length === 0 && (
                            <div className="col-span-full py-12 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
                                {t('dashboard.noSessions')}
                            </div>
                        )}
                        {sessions.length > 0 && sessions.filter(s => 
                            (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                            s.host.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.windows_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.assignedTo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (s.tags || []).some(tg => tg.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).length === 0 && (
                            <div className="col-span-full py-12 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
                                {t('dashboard.noMatching')}
                            </div>
                        )}
                    </div>
                )}            </div>
        </div>
    );
}
