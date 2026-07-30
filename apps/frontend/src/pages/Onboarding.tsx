import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Building2, ArrowLeft } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    // Step 1: Details
    const [displayName, setDisplayName] = useState('');
    const [internalName, setInternalName] = useState('');
    
    // Step 2: Employees & Server
    const [employees, setEmployees] = useState<{fullName: string, windowsUsername: string, targetHost: string, role: string}[]>([]);
    const [tempFullName, setTempFullName] = useState('');
    const [tempTargetHost, setTempTargetHost] = useState('');
    const [tempRole, setTempRole] = useState('user');
    const [hosts, setHosts] = useState<any[]>([]);

    // Step 3: Storage
    const [diskQuotaTB, setDiskQuotaTB] = useState(1);
    
    // Step 4: Pricing
    const [commitmentMonths, setCommitmentMonths] = useState(1);
    const [discountPct, setDiscountPct] = useState(0);
    const [marketingPct, setMarketingPct] = useState(0);
    const [campaign, setCampaign] = useState('none');
    const [defaultPassword, setDefaultPassword] = useState('PratikBulut@2026');

    // Data from Backend
    const [eurRate, setEurRate] = useState(40.0);
    const [settings, setSettings] = useState<any>({
        baseOfficeEur: 50,
        baseComputeEur: 150,
        baseStorageEur: 15
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch Rates
                const rateRes = await axios.get('/api/admin/onboarding/rates', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (rateRes.data?.rates?.TRY) {
                    setEurRate(rateRes.data.rates.TRY);
                }
                
                // Fetch Settings
                const setRes = await axios.get('/api/admin/settings', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSettings(setRes.data);

                // Fetch Hosts
                const hostRes = await axios.get('/api/admin/hosts', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setHosts(hostRes.data);
            } catch (e) {
                console.error("Init err", e);
            }
        };
        init();
    }, []);

    const sanitizeName = (name: string) => {
        return name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '');
    };

    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempFullName.trim() || !tempTargetHost) return;

        const parts = tempFullName.trim().split(' ');
        let generated = '';
        if (parts.length === 1) {
            generated = sanitizeName(parts[0]);
        } else {
            const last = parts.pop() || '';
            const first = parts.join('');
            generated = sanitizeName(first) + sanitizeName(last.charAt(0));
        }

        setEmployees([...employees, { fullName: tempFullName, windowsUsername: generated, targetHost: tempTargetHost, role: tempRole }]);
        setTempFullName('');
        // Optional: Keep tempTargetHost and tempRole selected for quick adding of multiple similar users
    };

    const removeEmployee = (idx: number) => {
        setEmployees(employees.filter((_, i) => i !== idx));
    };

    // Calculate Price
    let grossPriceEur = diskQuotaTB * settings.baseStorageEur;
    for (const emp of employees) {
        let basePerUser = 50; // default
        const tgt = emp.targetHost.toLowerCase();
        if (tgt.includes('compute')) basePerUser = settings.baseComputeEur;
        else if (tgt.includes('office')) basePerUser = settings.baseOfficeEur;
        grossPriceEur += basePerUser;
    }

    const netPriceEur = grossPriceEur - (grossPriceEur * discountPct / 100);
    const marketingShareEur = netPriceEur * marketingPct / 100;
    
    const handleSubmit = async () => {
        setLoading(true);
        try {
            await axios.post('/api/admin/onboarding', {
                displayName,
                internalName,
                diskQuotaTB,
                baseOfficeEur: settings.baseOfficeEur,
                baseComputeEur: settings.baseComputeEur,
                baseStorageEur: settings.baseStorageEur,
                commitmentMonths,
                discountPct,
                marketingPct,
                netPriceEur,
                defaultPassword,
                campaign,
                employees
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setDisplayName(''); setInternalName(''); setEmployees([]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Building2 size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">{t('admin.onboarding')}</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                    </div>
                </header>
            
                <main className="space-y-6">
                
                {/* Step 1 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step1')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.displayName')}</label>
                            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" placeholder="Şener Lojistik" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.internalName')}</label>
                            <input value={internalName} onChange={e => setInternalName(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" placeholder="SenerLojistik" />
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step2')}</h2>
                    
                    <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.targetHost')}</label>
                            <select required value={tempTargetHost} onChange={e => setTempTargetHost(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm">
                                <option value="">{t('admin.selectServerType')}</option>
                                {hosts.map(h => <option key={h.id} value={h.hostname}>{h.hostname}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Rol</label>
                            <select value={tempRole} onChange={e => setTempRole(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm">
                                <option value="user">Kullanıcı</option>
                                <option value="manager">Yönetici</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.fullName')}</label>
                            <div className="flex gap-2">
                                <input required value={tempFullName} onChange={e => setTempFullName(e.target.value)} placeholder={t('onboarding.fullName')} className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                                <button type="submit" className="bg-[var(--color-text)] text-[var(--color-background)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shrink-0">{t('onboarding.addEmployee')}</button>
                            </div>
                        </div>
                    </form>

                    {employees.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('onboarding.fullName')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('onboarding.winUsername')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">Rol</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">Sunucu</th>
                                        <th className="pb-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp, idx) => (
                                        <tr key={idx} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]/50 transition-colors">
                                            <td className="py-3 text-[var(--color-text)] font-medium">{emp.fullName}</td>
                                            <td className="py-3 font-mono">{emp.windowsUsername}</td>
                                            <td className="py-3">{emp.role === 'manager' ? 'Yönetici' : 'Kullanıcı'}</td>
                                            <td className="py-3">{emp.targetHost}</td>
                                            <td className="py-3 text-right">
                                                <button onClick={() => removeEmployee(idx)} className="text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-400/10 rounded">Sil</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Step 3 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step3')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.diskQuota')}</label>
                            <input type="number" min="0" step="0.5" value={diskQuotaTB} onChange={e => setDiskQuotaTB(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Kampanya</label>
                            <select value={campaign} onChange={e => setCampaign(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm">
                                <option value="none">Kampanyasız</option>
                                <option value="1_month_free">İlk 1 Ay Ücretsiz</option>
                                <option value="3_months_free">İlk 3 Ay Ücretsiz</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step4')}</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.commitment')}</label>
                            <input type="number" min="1" value={commitmentMonths} onChange={e => setCommitmentMonths(parseInt(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.discount')}</label>
                            <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(parseFloat(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.marketing')}</label>
                            <input type="number" min="0" max="100" value={marketingPct} onChange={e => setMarketingPct(parseFloat(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.defaultPassword')}</label>
                            <input type="text" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-sm" />
                        </div>
                    </div>

                    <div className="bg-[var(--color-background)] p-5 rounded-xl border border-[var(--color-border)]">
                        <div className="flex justify-between mb-2 text-sm">
                            <span className="text-[var(--color-text-muted)]">{t('onboarding.grossPrice')}:</span>
                            <span className="font-medium text-[var(--color-text)]">{grossPriceEur.toFixed(2)} EUR</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm">
                            <span className="text-[var(--color-text-muted)]">{t('onboarding.discount')}:</span>
                            <span className="text-red-400 font-medium">-{discountPct}%</span>
                        </div>
                        <div className="flex justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)] font-medium">{t('onboarding.netPrice')}:</span>
                            <span className="text-emerald-500 font-semibold">{netPriceEur.toFixed(2)} EUR <span className="text-xs text-[var(--color-text-muted)] font-normal">(~{(netPriceEur * eurRate).toFixed(2)} TRY)</span></span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Pazarlama Payı ({marketingPct}%):</span>
                            <span className="font-medium text-[var(--color-text)]">{marketingShareEur.toFixed(2)} EUR</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end items-center gap-4">
                        {success && <span className="text-emerald-500 text-sm font-medium">{t('common.success')}!</span>}
                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !internalName || employees.length === 0}
                            className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 px-6 py-2 rounded-lg font-medium hover:bg-emerald-600/20 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '...' : t('onboarding.submit')}
                        </button>
                    </div>
                </div>

            </main>
            </div>
        </div>
    );
};

export default Onboarding;
