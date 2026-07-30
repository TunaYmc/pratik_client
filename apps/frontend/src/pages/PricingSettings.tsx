import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';

const PricingSettings: React.FC = () => {
    const { t } = useLanguage();
    const [officeEur, setOfficeEur] = useState(50);
    const [computeEur, setComputeEur] = useState(150);
    const [storageEur, setStorageEur] = useState(15);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/api/admin/settings', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setOfficeEur(res.data.baseOfficeEur);
                setComputeEur(res.data.baseComputeEur);
                setStorageEur(res.data.baseStorageEur);
            } catch (e) {
                console.error(e);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            await axios.post('/api/admin/settings', {
                baseOfficeEur: officeEur,
                baseComputeEur: computeEur,
                baseStorageEur: storageEur
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)] overflow-y-auto">
            <header className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('admin.pricingSettings')}</h1>
            </header>
            
            <main className="p-8 max-w-3xl">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('admin.baseOfficeEur')}</label>
                        <input 
                            type="number" 
                            value={officeEur} 
                            onChange={e => setOfficeEur(parseFloat(e.target.value))}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('admin.baseComputeEur')}</label>
                        <input 
                            type="number" 
                            value={computeEur} 
                            onChange={e => setComputeEur(parseFloat(e.target.value))}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('admin.baseStorageEur')}</label>
                        <input 
                            type="number" 
                            value={storageEur} 
                            onChange={e => setStorageEur(parseFloat(e.target.value))}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[var(--color-primary)] text-white px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? '...' : t('common.save')}
                    </button>
                    {success && <span className="ml-4 text-emerald-500 text-sm font-medium">{t('common.success')}!</span>}
                </div>
            </main>
        </div>
    );
};

export default PricingSettings;
