import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Building, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const Companies: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get('/api/admin/onboarding/companies', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCompanies(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (window.confirm(`${name} şirketini ve tüm kullanıcılarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            try {
                await axios.delete(`/api/admin/onboarding/companies/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCompanies(companies.filter(c => c.id !== id));
            } catch (err) {
                console.error(err);
                alert("Şirket silinirken bir hata oluştu.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Building size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">Şirketler</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <ArrowLeft size={16} /> {t('common.back')}
                        </button>
                        <button onClick={() => navigate('/admin/onboarding')} className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--color-text)] text-[var(--color-background)] rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm">
                            <Plus size={16} /> Şirket Ekle
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-12 text-[var(--color-text-muted)]">{t('common.loading')}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                                Henüz şirket eklenmemiş.
                            </div>
                        ) : (
                            companies.map((company) => (
                                <div 
                                    key={company.id} 
                                    onClick={() => navigate(`/admin/companies/${company.id}`)}
                                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-primary)] transition-all cursor-pointer relative group flex flex-col h-full"
                                >
                                    <button 
                                        onClick={(e) => handleDelete(e, company.id, company.displayName)}
                                        className="absolute top-4 right-4 p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Şirketi Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                                            {company.displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--color-text)]">{company.displayName}</h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">{company.internalName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 mb-6">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[var(--color-text-muted)] flex items-center gap-1"><Users size={14} /> Çalışan</span>
                                            <span className="font-medium">{company.employees?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[var(--color-text-muted)]">Aylık Tutar</span>
                                            <span className="font-medium">€{company.netPriceEur.toFixed(2)}</span>
                                        </div>
                                        {company.campaign !== 'none' && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[var(--color-text-muted)]">Kampanya</span>
                                                <span className="font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                                                    {company.campaign === '1_month_free' ? 'İlk 1 Ay Ücretsiz' : 
                                                     company.campaign === '3_months_free' ? 'İlk 3 Ay Ücretsiz' : company.campaign}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`text-center py-2 rounded text-xs font-medium ${
                                        company.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                        company.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                        {company.status.toUpperCase()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
