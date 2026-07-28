import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Moon, Sun, LogOut, Check, Loader2, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

export default function Settings() {
    const navigate = useNavigate();
    const { lang, setLang, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    const [rdpSettings, setRdpSettings] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        if (isAuthenticated) {
            axios.get('/api/user/settings', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(res => setRdpSettings(res.data)).catch(console.error);
        }
    }, [isAuthenticated]);

    const updateRdpSetting = async (key: string, value: any) => {
        const newSettings = { ...rdpSettings, [key]: value };
        setRdpSettings(newSettings);
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await axios.put('/api/user/settings', newSettings, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Failed to save settings', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            alert(t('alert.passwordMismatch'));
            return;
        }
        if (newPassword.length < 6) return;
        
        setPasswordLoading(true);
        try {
            await axios.put('/api/user/settings/password', { currentPassword, newPassword }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(t('alert.passwordChanged'));
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        } catch (error) {
            alert(t('alert.failedPasswordChange'));
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <SettingsIcon size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">{t('settings.title')}</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate(localStorage.getItem('token') ? '/' : '/login')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <Home size={16} /> {localStorage.getItem('token') ? t('common.home') : t('login.signIn')}
                        </button>
                        {localStorage.getItem('token') && (
                            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                                <LogOut size={16} /> {t('common.logout')}
                            </button>
                        )}
                    </div>
                </header>

                <div className="space-y-6">
                    {/* Language & Theme Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Language Setting */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col">
                            <h2 className="text-lg font-medium mb-1">{t('settings.language')}</h2>
                            <p className="text-sm text-[var(--color-text-muted)] mb-5 flex-grow">{t('settings.languageDesc')}</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setLang('tr')}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                        lang === 'tr'
                                            ? 'border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/10'
                                            : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-background)]'
                                    }`}
                                >
                                    <img src="https://flagcdn.com/w40/tr.png" alt="TR" className="w-6 h-auto rounded-sm shadow-sm" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium">Türkçe</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setLang('en')}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                        lang === 'en'
                                            ? 'border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/10'
                                            : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-background)]'
                                    }`}
                                >
                                    <img src="https://flagcdn.com/w40/gb.png" alt="EN" className="w-6 h-auto rounded-sm shadow-sm" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium">English</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Theme Setting */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col">
                            <h2 className="text-lg font-medium mb-1">{t('settings.theme')}</h2>
                            <p className="text-sm text-[var(--color-text-muted)] mb-5 flex-grow">{t('settings.themeDesc')}</p>

                            <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-3.5 border border-[var(--color-border)]">
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? (
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <Moon size={20} />
                                        </div>
                                    ) : (
                                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                            <Sun size={20} />
                                        </div>
                                    )}
                                    <div className="text-sm font-medium">{theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}</div>
                                </div>

                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                                        theme === 'light' ? 'bg-blue-500' : 'bg-[var(--color-border)]'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                                            theme === 'light' ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    >
                                        {theme === 'dark' ? <Moon size={10} className="text-gray-600" /> : <Sun size={10} className="text-amber-500" />}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Password Setting (Only if Authenticated) */}
                    {isAuthenticated && (
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                            <h2 className="text-lg font-medium mb-1">{t('settings.accountPassword')}</h2>
                            <p className="text-sm text-[var(--color-text-muted)] mb-5">{t('settings.accountPasswordDesc')}</p>
                            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('settings.currentPassword')}</label>
                                    <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('settings.newPassword')}</label>
                                    <input required minLength={6} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('settings.confirmNewPassword')}</label>
                                    <input required minLength={6} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                                </div>
                                <div className="md:col-span-3 flex justify-end mt-2">
                                    <button disabled={passwordLoading} type="submit" className="bg-[var(--color-text)] text-[var(--color-background)] hover:bg-gray-200 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                                        {passwordLoading && <Loader2 size={16} className="animate-spin" />} {t('settings.updatePassword')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* RDP Settings (Only if Authenticated) */}
                    {isAuthenticated && (
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-lg font-medium">{t('settings.rdpPreferences')}</h2>
                                <div className="h-6 flex items-center">
                                    {isSaving && <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> {t('settings.savingOptions')}</span>}
                                    {saveSuccess && <span className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> {t('settings.optionsSaved')}</span>}
                                </div>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)] mb-5">{t('settings.rdpDesc')}</p>

                            <div className="space-y-4">
                                {/* Multi-Monitor */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.multiMonitor')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.multiMonitorDesc')}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('multiMonitor', !rdpSettings.multiMonitor)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.multiMonitor ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.multiMonitor ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* High Resolution & Clarity */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.highResolution')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.highResolutionDesc')}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('highResolution', !rdpSettings.highResolution)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.highResolution ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.highResolution ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Clipboard Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.clipboardRedirection')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.clipboardRedirectionDesc')}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('clipboardRedirection', !rdpSettings.clipboardRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.clipboardRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.clipboardRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Smart Sizing */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.smartSizing')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.smartSizingDesc')}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('smartSizing', !rdpSettings.smartSizing)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.smartSizing ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.smartSizing ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Printer Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.printerRedirection')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.printerRedirectionDesc')}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('printerRedirection', !rdpSettings.printerRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.printerRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.printerRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Microphone Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.microphoneRedirection') || 'Mikrofon Yönlendirmesi'}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.microphoneRedirectionDesc') || 'Yerel mikrofonunuzu uzak bilgisayarda kullanın.'}</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('microphoneRedirection', !rdpSettings.microphoneRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.microphoneRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.microphoneRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Drive Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">Yerel Disk Yönlendirmesi</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Bilgisayarınızdaki diskleri uzak sunucuyla paylaşın.</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('driveRedirection', !rdpSettings.driveRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.driveRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.driveRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Smartcard Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">Akıllı Kart Yönlendirmesi</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Akıllı kart (Smartcard) cihazlarınızı uzak sunucuyla paylaşın.</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('smartCardRedirection', !rdpSettings.smartCardRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.smartCardRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.smartCardRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* COM Port Redirection */}
                                <div className="flex items-center justify-between bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">COM Bağlantı Noktası Yönlendirmesi</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">Seri bağlantı noktalarınızı (COM Ports) uzak sunucuyla paylaşın.</div>
                                    </div>
                                    <button onClick={() => updateRdpSetting('comPortRedirection', !rdpSettings.comPortRedirection)} className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${rdpSettings.comPortRedirection ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${rdpSettings.comPortRedirection ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </button>
                                </div>

                                {/* Audio Playback Mode */}
                                <div className="flex flex-col gap-3 bg-[var(--color-background)] rounded-xl px-5 py-4 border border-[var(--color-border)]">
                                    <div className="pr-4">
                                        <div className="text-sm font-medium">{t('settings.audioMode')}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{t('settings.audioModeDesc')}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => updateRdpSetting('audioMode', 0)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${rdpSettings.audioMode === 0 || rdpSettings.audioMode === undefined ? 'bg-[var(--color-surface)] border-blue-500 text-[var(--color-text)]' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'}`}>
                                            {t('settings.audioModeLocal')}
                                        </button>
                                        <button onClick={() => updateRdpSetting('audioMode', 2)} className={`px-4 py-2 rounded-lg text-sm border transition-colors ${rdpSettings.audioMode === 2 ? 'bg-[var(--color-surface)] border-blue-500 text-[var(--color-text)]' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'}`}>
                                            {t('settings.audioModeMute')}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
