import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';

const Onboarding: React.FC = () => {
    const { t } = useLanguage();
    
    // Step 1: Details
    const [displayName, setDisplayName] = useState('');
    const [internalName, setInternalName] = useState('');
    
    // Step 2: Employees & Server
    const [employees, setEmployees] = useState<{fullName: string, windowsUsername: string}[]>([]);
    const [tempFullName, setTempFullName] = useState('');
    const [targetHost, setTargetHost] = useState('');
    const [hosts, setHosts] = useState<any[]>([]);

    // Step 3: Storage
    const [diskQuotaTB, setDiskQuotaTB] = useState(1);
    
    // Step 4: Pricing
    const [commitmentMonths, setCommitmentMonths] = useState(1);
    const [discountPct, setDiscountPct] = useState(0);
    const [marketingPct, setMarketingPct] = useState(0);
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
        if (!tempFullName.trim()) return;

        const parts = tempFullName.trim().split(' ');
        let generated = '';
        if (parts.length === 1) {
            generated = sanitizeName(parts[0]);
        } else {
            const last = parts.pop() || '';
            const first = parts.join('');
            generated = sanitizeName(first) + sanitizeName(last.charAt(0));
        }

        setEmployees([...employees, { fullName: tempFullName, windowsUsername: generated }]);
        setTempFullName('');
    };

    const removeEmployee = (idx: number) => {
        setEmployees(employees.filter((_, i) => i !== idx));
    };

    // Calculate Price
    let basePerUser = 50; // default
    const tgt = targetHost.toLowerCase();
    if (tgt.includes('compute')) basePerUser = settings.baseComputeEur;
    else if (tgt.includes('office')) basePerUser = settings.baseOfficeEur;

    const grossPriceEur = (employees.length * basePerUser) + (diskQuotaTB * settings.baseStorageEur);
    const netPriceEur = grossPriceEur - (grossPriceEur * discountPct / 100);
    const marketingShareEur = netPriceEur * marketingPct / 100;
    
    const handleSubmit = async () => {
        setLoading(true);
        try {
            await axios.post('/api/admin/onboarding', {
                displayName,
                internalName,
                targetHost,
                diskQuotaTB,
                baseOfficeEur: settings.baseOfficeEur,
                baseComputeEur: settings.baseComputeEur,
                baseStorageEur: settings.baseStorageEur,
                commitmentMonths,
                discountPct,
                marketingPct,
                netPriceEur,
                defaultPassword,
                employees
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setDisplayName(''); setInternalName(''); setEmployees([]); setTargetHost('');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] overflow-y-auto">
            <header className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('admin.onboarding')}</h1>
            </header>
            
            <main className="p-8 max-w-4xl space-y-6">
                
                {/* Step 1 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step1')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('onboarding.displayName')}</label>
                            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" placeholder="Şener Lojistik" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('onboarding.internalName')}</label>
                            <input value={internalName} onChange={e => setInternalName(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" placeholder="SenerLojistik" />
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step2')}</h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('onboarding.targetHost')}</label>
                        <select value={targetHost} onChange={e => setTargetHost(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm">
                            <option value="">{t('admin.selectServerType')}</option>
                            {hosts.map(h => <option key={h.id} value={h.hostname}>{h.hostname}</option>)}
                        </select>
                    </div>

                    <form onSubmit={handleAddEmployee} className="flex gap-2 mb-4">
                        <input value={tempFullName} onChange={e => setTempFullName(e.target.value)} placeholder={t('onboarding.fullName')} className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                        <button type="submit" className="bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded text-sm font-medium hover:bg-blue-600/20">{t('onboarding.addEmployee')}</button>
                    </form>

                    {employees.length > 0 && (
                        <div className="border border-[var(--color-border)] rounded bg-[var(--color-background)] overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)]">
                                    <tr>
                                        <th className="px-4 py-2">{t('onboarding.fullName')}</th>
                                        <th className="px-4 py-2">{t('onboarding.winUsername')}</th>
                                        <th className="px-4 py-2 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp, idx) => (
                                        <tr key={idx} className="border-b border-[var(--color-border)] last:border-0">
                                            <td className="px-4 py-2">{emp.fullName}</td>
                                            <td className="px-4 py-2 font-mono text-[var(--color-text-muted)]">{emp.windowsUsername}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={() => removeEmployee(idx)} className="text-red-400 hover:text-red-300">X</button>
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
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('onboarding.diskQuota')}</label>
                        <input type="number" min="0" step="0.5" value={diskQuotaTB} onChange={e => setDiskQuotaTB(parseFloat(e.target.value) || 0)} className="w-full md:w-1/3 bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                    </div>
                </div>

                {/* Step 4 */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h2 className="text-lg font-medium mb-4">{t('onboarding.step4')}</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.commitment')}</label>
                            <input type="number" min="1" value={commitmentMonths} onChange={e => setCommitmentMonths(parseInt(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.discount')}</label>
                            <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(parseFloat(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.marketing')}</label>
                            <input type="number" min="0" max="100" value={marketingPct} onChange={e => setMarketingPct(parseFloat(e.target.value))} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('onboarding.defaultPassword')}</label>
                            <input type="text" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div className="bg-[var(--color-background)] p-4 rounded border border-[var(--color-border)]">
                        <div className="flex justify-between mb-2 text-sm">
                            <span className="text-[var(--color-text-muted)]">{t('onboarding.grossPrice')}:</span>
                            <span>{grossPriceEur.toFixed(2)} EUR</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm">
                            <span className="text-[var(--color-text-muted)]">{t('onboarding.discount')}:</span>
                            <span className="text-red-400">-{discountPct}%</span>
                        </div>
                        <div className="flex justify-between mb-4 pb-4 border-b border-[var(--color-border)] font-medium">
                            <span>{t('onboarding.netPrice')}:</span>
                            <span className="text-emerald-400">{netPriceEur.toFixed(2)} EUR <span className="text-xs text-[var(--color-text-muted)]">(~{(netPriceEur * eurRate).toFixed(2)} TRY)</span></span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Pazarlama Payı ({marketingPct}%):</span>
                            <span>{marketingShareEur.toFixed(2)} EUR</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !internalName || employees.length === 0 || !targetHost}
                            className="bg-emerald-600 text-white px-6 py-2 rounded font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '...' : t('onboarding.submit')}
                        </button>
                        {success && <span className="text-emerald-500 font-medium">{t('common.success')}!</span>}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Onboarding;
