import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, UserPlus, Building } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

function sanitizeName(name: string): string {
    return name
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export const CompanyDetails: React.FC = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hosts, setHosts] = useState<any[]>([]);

    // Form states
    const [tempFullName, setTempFullName] = useState('');
    const [tempTargetHost, setTempTargetHost] = useState('');
    const [tempRole, setTempRole] = useState('user');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [compRes, hostsRes] = await Promise.all([
                    axios.get(`/api/admin/onboarding/companies/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    axios.get('/api/admin/system/hosts', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                ]);
                setCompany(compRes.data);
                setHosts(hostsRes.data);
            } catch (e) {
                console.error(e);
                navigate('/admin/companies');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempFullName.trim() || !tempTargetHost) return;

        setAdding(true);
        const parts = tempFullName.trim().split(' ');
        let generated = '';
        if (parts.length === 1) {
            generated = sanitizeName(parts[0]);
        } else {
            const last = parts.pop() || '';
            const first = parts.join('');
            generated = sanitizeName(first) + sanitizeName(last.charAt(0));
        }

        try {
            const payload = {
                fullName: tempFullName,
                windowsUsername: generated,
                targetHost: tempTargetHost,
                role: tempRole
            };
            const res = await axios.post(`/api/admin/onboarding/companies/${id}/employees`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCompany({ ...company, employees: [...company.employees, res.data] });
            setTempFullName('');
        } catch (err) {
            console.error(err);
            alert("Çalışan eklenirken bir hata oluştu.");
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveEmployee = async (employeeId: number) => {
        if (!window.confirm("Bu çalışanı ve bağlı olduğu hesabı silmek istediğinize emin misiniz?")) return;
        
        try {
            await axios.delete(`/api/admin/onboarding/companies/${id}/employees/${employeeId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCompany({ ...company, employees: company.employees.filter((e: any) => e.id !== employeeId) });
        } catch (err) {
            console.error(err);
            alert("Çalışan silinirken bir hata oluştu.");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[var(--color-background)] p-8 flex justify-center text-[var(--color-text-muted)]">{t('common.loading')}</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Building size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">{company.displayName}</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate('/admin/companies')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <ArrowLeft size={16} /> Şirketler
                        </button>
                    </div>
                </header>

                <div className="space-y-6">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><UserPlus size={18}/> Çalışan Ekle</h2>
                        <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <button disabled={adding} type="submit" className="bg-[var(--color-text)] text-[var(--color-background)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shrink-0 disabled:opacity-50">
                                        {adding ? '...' : t('onboarding.addEmployee')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                        <h2 className="text-lg font-medium mb-4">Çalışan Listesi</h2>
                        {company.employees && company.employees.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <th className="pb-3 font-medium text-[var(--color-text)]">{t('onboarding.fullName')}</th>
                                            <th className="pb-3 font-medium text-[var(--color-text)]">{t('onboarding.winUsername')}</th>
                                            <th className="pb-3 font-medium text-[var(--color-text)]">Rol</th>
                                            <th className="pb-3 font-medium text-[var(--color-text)]">Sunucu</th>
                                            <th className="pb-3 font-medium text-[var(--color-text)] text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.employees.map((emp: any) => (
                                            <tr key={emp.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]/50 transition-colors">
                                                <td className="py-3 text-[var(--color-text)] font-medium">{emp.fullName}</td>
                                                <td className="py-3 font-mono">{emp.windowsUsername}</td>
                                                <td className="py-3">{emp.role === 'manager' ? 'Yönetici' : 'Kullanıcı'}</td>
                                                <td className="py-3">{emp.targetHost}</td>
                                                <td className="py-3 text-right">
                                                    <button onClick={() => handleRemoveEmployee(emp.id)} className="text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-400/10 rounded">
                                                        Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">Bu şirkete henüz çalışan eklenmemiş.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
