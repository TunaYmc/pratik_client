import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Trash2, Home, Plus, Tag, X, Settings, Wrench, Key } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function Admin() {
    const [users, setUsers] = useState<any[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const [assignments, setAssignments] = useState<any[]>([]);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [totalAssignments, setTotalAssignments] = useState(0);

    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditPage, setAuditPage] = useState(1);
    const [totalAuditLogs, setTotalAuditLogs] = useState(0);

    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [hosts, setHosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingHosts, setLoadingHosts] = useState(false);
    
    // User role context
    const currentRole = localStorage.getItem('role');
    const { t } = useLanguage();

    // Create User State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Assign RDP State
    const [selectedUser, setSelectedUser] = useState('');
    const [winUsername, setWinUsername] = useState('');
    const [host, setHost] = useState('');
    const [description, setDescription] = useState('');
    const [durationDays, setDurationDays] = useState<number | undefined>(undefined);
    const [initialPassword, setInitialPassword] = useState('');

    const [userSearch, setUserSearch] = useState('');
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [liveSessionSearch, setLiveSessionSearch] = useState('');

    // Tag Management State (Managers)
    const [tags, setTags] = useState<any[]>([]);
    const [subordinates, setSubordinates] = useState<any[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');

    const navigate = useNavigate();

    useEffect(() => {
        fetchActiveSessions();
        if (currentRole === 'manager' || currentRole === 'admin') {
            fetchTags();
            fetchSubordinates();
            fetchHosts();
        }
    }, [currentRole]);

    useEffect(() => {
        fetchUsers();
    }, [userPage, userSearch]);

    useEffect(() => {
        fetchAssignments();
    }, [assignmentPage, assignmentSearch]);

    useEffect(() => {
        fetchAuditLogs();
    }, [auditPage]);

    const fetchActiveSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await axios.get('/api/admin/active-sessions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setActiveSessions(res.data);
        } catch {
            alert(t('alert.failedLoadSessions'));
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchHosts = async () => {
        if (currentRole !== 'admin' && currentRole !== 'manager') return;
        setLoadingHosts(true);
        try {
            const res = await axios.get('/api/admin/hosts', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setHosts(res.data);
        } catch {
            console.error('Failed to load hosts');
        } finally {
            setLoadingHosts(false);
        }
    };

    const fetchAuditLogs = async () => {
        if (currentRole !== 'manager' && currentRole !== 'admin') return;
        try {
            const res = await axios.get(`/api/admin/audit-logs?page=${auditPage}&limit=10`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setAuditLogs(res.data.data);
            setTotalAuditLogs(res.data.total);
        } catch {}
    };

    const fetchUsers = async () => {
        if (currentRole !== 'admin') return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/users?page=${userPage}&limit=10&search=${userSearch}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setUsers(res.data.data || res.data);
            setTotalUsers(res.data.total || (res.data.data || res.data).length);
        } catch {
            alert(t('alert.failedLoadUsers'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/assignments?page=${assignmentPage}&limit=10&search=${assignmentSearch}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setAssignments(res.data.data || res.data);
            setTotalAssignments(res.data.total || (res.data.data || res.data).length);
        } catch {
            alert(t('alert.failedLoadAssignments'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { email, password }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setEmail(''); setPassword('');
            fetchUsers();
        } catch {
            alert(t('alert.failedCreateUser'));
        }
    };

    const handleAssignRdp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/assign-rdp', {
                userId: parseInt(selectedUser),
                windows_username: winUsername,
                host,
                description,
                durationDays,
                initialPassword: initialPassword || undefined
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            alert(t('alert.assignedSuccess'));
            setWinUsername(''); setHost(''); setDescription(''); setDurationDays(undefined); setInitialPassword('');
            fetchAssignments();
        } catch {
            alert(t('alert.failedAssignRdp'));
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm(t('alert.confirmDelete'))) return;
        try {
            await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            fetchUsers();
            fetchAssignments();
        } catch {
            alert(t('alert.failedDelete'));
        }
    };

    const handleAdminResetPassword = async (id: number) => {
        const newPassword = prompt(t('admin.newPasswordPrompt'));
        if (!newPassword) return; // User cancelled
        if (newPassword.length < 6) return;

        try {
            await axios.put(`/api/admin/users/${id}/password`, { newPassword }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            alert(t('alert.adminPasswordChanged'));
        } catch {
            alert(t('alert.adminPasswordChangeFailed'));
        }
    };

    const handleRevokeAssignment = async (id: number) => {
        if (!confirm(t('alert.confirmRevoke'))) return;
        try {
            await axios.post(`/api/admin/assignments/${id}/revoke`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            fetchAssignments();
        } catch {
            alert(t('alert.failedRevoke'));
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await axios.post(`/api/admin/users/${userId}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            fetchUsers();
            alert(t('alert.roleUpdated'));
        } catch {
            alert(t('alert.failedRoleUpdate'));
        }
    };

    const handleManagerAssignment = async (userId: number, managerId: string) => {
        try {
            const payload = managerId === "" ? null : parseInt(managerId);
            await axios.post(`/api/admin/users/${userId}/manager`, { managerId: payload }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            fetchUsers();
            alert(t('alert.managerAssigned'));
        } catch {
            alert(t('alert.failedManagerAssign'));
        }
    };

    // --- Tag Handlers ---
    const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchTags = async () => {
        try {
            const res = await axios.get('/api/admin/tags', authHeader);
            setTags(res.data);
        } catch { /* silently fail for non-managers */ }
    };

    const fetchSubordinates = async () => {
        try {
            const res = await axios.get('/api/admin/tags/subordinates', authHeader);
            setSubordinates(res.data);
        } catch { /* silently fail */ }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/tags', { name: newTagName, color: newTagColor }, authHeader);
            setNewTagName('');
            fetchTags();
        } catch {
            alert(t('alert.failedCreateTag'));
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        if (!confirm(t('alert.confirmDeleteTag'))) return;
        try {
            await axios.delete(`/api/admin/tags/${tagId}`, authHeader);
            fetchTags();
            fetchSubordinates();
        } catch {
            alert(t('alert.failedDeleteTag'));
        }
    };

    const handleAssignTag = async (tagId: number, userId: number) => {
        try {
            await axios.post(`/api/admin/tags/${tagId}/assign/${userId}`, {}, authHeader);
            fetchTags();
            fetchSubordinates();
        } catch {
            alert(t('alert.failedAssignTag'));
        }
    };

    const handleRemoveTag = async (tagId: number, userId: number) => {
        try {
            await axios.delete(`/api/admin/tags/${tagId}/assign/${userId}`, authHeader);
            fetchTags();
            fetchSubordinates();
        } catch {
            alert(t('alert.failedRemoveTag'));
        }
    };

    const filteredLiveSessions = activeSessions.filter(s => 
        s.username.toLowerCase().includes(liveSessionSearch.toLowerCase()) ||
        s.sessionname.toLowerCase().includes(liveSessionSearch.toLowerCase()) ||
        s.state.toLowerCase().includes(liveSessionSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-[var(--color-border)] pb-6 relative gap-6 md:gap-0">
                    <div className="flex-1 flex w-full md:w-auto items-center justify-center md:justify-start gap-3 order-2 md:order-first">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Wrench size={24} />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight">{currentRole === 'manager' ? t('dashboard.managementPanel') : t('dashboard.adminPanel')}</h1>
                    </div>
                    <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center order-1 md:order-none">
                        <img src="/clientlogo.png" alt="Pratik Bulut Logo" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="flex gap-4 items-center order-3 md:order-last">
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <Settings size={16} /> {t('common.settings')}
                        </button>
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <Home size={16} /> {t('common.home')}
                        </button>
                        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                            <LogOut size={16} /> {t('common.logout')}
                        </button>
                    </div>
                </header>

                {currentRole === 'manager' ? (
                    /* ===== MANAGER LAYOUT: balanced 2-column ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Tags */}
                        <div className="space-y-8">
                            {/* Tag Management Panel */}
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Tag size={18} /> {t('admin.manageTags')}</h2>
                                <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
                                    <input
                                        required
                                        value={newTagName}
                                        onChange={e => setNewTagName(e.target.value)}
                                        placeholder={t('admin.tagPlaceholder')}
                                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                                    />
                                    <input
                                        type="color"
                                        value={newTagColor}
                                        onChange={e => setNewTagColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent"
                                    />
                                    <button type="submit" className="px-3 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors text-sm">
                                        <Plus size={16} />
                                    </button>
                                </form>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {tags.length === 0 && <p className="text-sm text-[var(--color-text-muted)] italic">{t('admin.noTags')}</p>}
                                    {tags.map((tag: any) => (
                                        <div key={tag.id} className="flex items-center justify-between bg-[var(--color-background)] rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#3b82f6' }}></span>
                                                <span className="text-sm font-medium">{tag.name}</span>
                                                <span className="text-xs text-[var(--color-text-muted)]">({tag.userTags?.length || 0})</span>
                                            </div>
                                            <button onClick={() => handleDeleteTag(tag.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subordinate Tags */}
                            {subordinates.length > 0 && (
                                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                    <h2 className="text-lg font-medium mb-4">{t('admin.subordinateTags')}</h2>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {subordinates.map((sub: any) => (
                                            <div key={sub.id} className="bg-[var(--color-background)] rounded-lg p-3">
                                                <div className="text-sm font-medium mb-2">{sub.email}</div>
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {sub.userTags?.map((ut: any) => (
                                                        <span key={ut.tag.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: ut.tag.color || '#3b82f6', color: getContrastYIQ(ut.tag.color || '#3b82f6') }}>
                                                            {ut.tag.name}
                                                            <button onClick={() => handleRemoveTag(ut.tag.id, sub.id)} className="hover:opacity-70"><X size={12} /></button>
                                                        </span>
                                                    ))}
                                                    {(!sub.userTags || sub.userTags.length === 0) && <span className="text-xs italic text-[var(--color-text-muted)]">{t('admin.noTagsAssigned')}</span>}
                                                </div>
                                                {tags.length > 0 && (
                                                    <select
                                                        defaultValue=""
                                                        onChange={(e) => { if (e.target.value) { handleAssignTag(parseInt(e.target.value), sub.id); e.target.value = ''; }}}
                                                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--color-primary)]"
                                                    >
                                                        <option value="">{t('admin.assignTag')}</option>
                                                        {tags.filter((t: any) => !(sub.userTags || []).some((ut: any) => ut.tag.id === t.id)).map((t: any) => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Active Assignments */}
                        <div className="space-y-8">
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium">{t('admin.activeAssignments')}</h2>
                                    <input type="text" placeholder={t('common.search')} value={assignmentSearch} onChange={e => {setAssignmentSearch(e.target.value); setAssignmentPage(1);}} className="bg-[var(--color-background)] rounded px-3 py-1 text-sm border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)] max-w-[150px]" />
                                </div>
                                {loading ? <p>{t('common.loading')}</p> : (
                                    <div className="overflow-x-auto max-h-[500px]">
                                        <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                            <thead>
                                                <tr className="border-b border-[var(--color-border)]">
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('common.user')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('common.target')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)] text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border)]">
                                                {assignments.map(a => (
                                                    <tr key={a.id} className="hover:bg-[var(--color-surface-hover)]">
                                                        <td className="py-2.5 truncate max-w-[100px]" title={a.user?.email}>{a.user?.email}</td>
                                                        <td className="py-2.5">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-[var(--color-text)] truncate max-w-[120px]" title={a.windowsAccount?.description || a.windowsAccount?.host}>{a.windowsAccount?.description || a.windowsAccount?.host}</span>
                                                                <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[120px]">{a.windowsAccount?.windows_username}@pratikbulut.local</span>
                                                                {a.expiresAt && <span className="text-xs text-amber-400 mt-0.5">{t('admin.expires')}: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            <button
                                                                onClick={() => handleRevokeAssignment(a.id)}
                                                                className="text-red-400 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded border border-red-400/20 text-xs transition-colors"
                                                                title={t('admin.revokeAssignment')}
                                                            >
                                                                {t('common.revoke')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {assignments.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="py-6 text-center italic">{t('admin.noAssignments')}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="flex justify-between items-center mt-4">
                                            <button disabled={assignmentPage === 1} onClick={() => setAssignmentPage(p => p - 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.previous')}</button>
                                            <span className="text-xs text-[var(--color-text-muted)]">{t('common.page')} {assignmentPage} {t('common.pageOf')} {Math.ceil(totalAssignments / 10) || 1}</span>
                                            <button disabled={assignmentPage >= Math.ceil(totalAssignments / 10)} onClick={() => setAssignmentPage(p => p + 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.next')}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== ADMIN LAYOUT: original 3-column (2+1) ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-8">
                        {currentRole === 'admin' && (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium">{t('admin.users')}</h2>
                                    <input type="text" placeholder={t('common.search')} value={userSearch} onChange={e => {setUserSearch(e.target.value); setUserPage(1);}} className="bg-[var(--color-background)] rounded px-3 py-1 text-sm border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]" />
                                </div>
                                {loading ? <p>{t('common.loading')}</p> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                            <thead>
                                                <tr className="border-b border-[var(--color-border)]">
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('common.email')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.role')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.manager')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.joined')}</th>
                                                    <th className="pb-3 font-medium text-[var(--color-text)]"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border)]">
                                                {users.map(u => (
                                                    <tr key={u.id} className="hover:bg-[var(--color-surface-hover)]">
                                                        <td className="py-3">{u.email}</td>
                                                        <td className="py-3">
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                className="bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--color-primary)]"
                                                                disabled={u.role === 'admin' && u.email === 'admin@nanodata.com'}
                                                            >
                                                                <option value="user">{t('common.user')}</option>
                                                                <option value="manager">{t('admin.manager')}</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-3">
                                                            {u.role !== 'admin' ? (
                                                                <select
                                                                    value={u.managerId || ''}
                                                                    onChange={(e) => handleManagerAssignment(u.id, e.target.value)}
                                                                    className="bg-[var(--color-background)] border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--color-primary)] max-w-[120px] truncate"
                                                                >
                                                                    <option value="">{t('common.none')}</option>
                                                                    {users.filter(potMgr => potMgr.role === 'manager' || potMgr.role === 'admin').map((mgr) => (
                                                                        <option key={mgr.id} value={mgr.id}>{mgr.email}</option>
                                                                    ))}
                                                                </select>
                                                            ) : <span className="text-xs italic">{t('common.na')}</span>}
                                                        </td>
                                                        <td className="py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-3 text-right flex justify-end items-center gap-1">
                                                            {u.role !== 'admin' && (
                                                                <>
                                                                    <button onClick={() => handleAdminResetPassword(u.id)} title={t('admin.resetPassword')} className="text-yellow-500 hover:text-yellow-400 p-1">
                                                                        <Key size={16} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300 p-1">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="flex justify-between items-center mt-4">
                                            <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.previous')}</button>
                                            <span className="text-xs text-[var(--color-text-muted)]">{t('common.page')} {userPage} {t('common.pageOf')} {Math.ceil(totalUsers / 10) || 1}</span>
                                            <button disabled={userPage >= Math.ceil(totalUsers / 10)} onClick={() => setUserPage(p => p + 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.next')}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentRole === 'admin' && (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                <h2 className="text-lg font-medium mb-4">{t('admin.assignRemoteDesktop')}</h2>
                                <form onSubmit={handleAssignRdp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('common.user')}</label>
                                        <select required value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]">
                                            <option value="">{t('admin.selectUser')}</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('admin.windowsUsername')}</label>
                                        <input required value={winUsername} onChange={e => setWinUsername(e.target.value)} placeholder="tuna.yamac" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('admin.targetHost')}</label>
                                        <select required value={host} onChange={e => setHost(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]">
                                            <option value="">{t('admin.selectServerType') || 'Sunucu Tipi Seçin'}</option>
                                            <option value="pb-compute-node.pratikbulut.local">Compute Server</option>
                                            <option value="pb-office-node.pratikbulut.local">Office Server</option>
                                        </select>
                                    </div>
                                    {/* Initial Password input temporarily disabled
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('admin.initialPassword')}</label>
                                        <input value={initialPassword} onChange={e => setInitialPassword(e.target.value)} placeholder={t('admin.initialPasswordPlaceholder')} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    */}
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('admin.labelDescription')}</label>
                                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Finance Dept Server" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('admin.accessDuration')}</label>
                                        <select value={durationDays || ''} onChange={e => setDurationDays(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]">
                                            <option value="">{t('admin.indefinite')}</option>
                                            <option value="1">{t('admin.1day')}</option>
                                            <option value="7">{t('admin.7days')}</option>
                                            <option value="30">{t('admin.30days')}</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 mt-2">
                                        <button type="submit" className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white py-2 rounded-lg transition-colors flex justify-center items-center gap-2">
                                            <Plus size={16} /> {t('admin.assignRdpAccess')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {currentRole === 'admin' && (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                                <h2 className="text-lg font-medium mb-4">{t('admin.createUser')}</h2>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('common.email')}</label>
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">{t('common.password')}</label>
                                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <button type="submit" className="w-full bg-[var(--color-text)] text-[var(--color-background)] hover:bg-gray-200 py-2 rounded-lg transition-colors">
                                        {t('admin.createUser')}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Active Assignments List */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">{t('admin.activeAssignments')}</h2>
                                <input type="text" placeholder={t('common.search')} value={assignmentSearch} onChange={e => {setAssignmentSearch(e.target.value); setAssignmentPage(1);}} className="bg-[var(--color-background)] rounded px-3 py-1 text-sm border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)] max-w-[150px]" />
                            </div>

                            {loading ? <p>{t('common.loading')}</p> : (
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                        <thead>
                                            <tr className="border-b border-[var(--color-border)]">
                                                <th className="pb-3 font-medium text-[var(--color-text)]">{t('common.user')}</th>
                                                <th className="pb-3 font-medium text-[var(--color-text)]">{t('common.target')}</th>
                                                <th className="pb-3 font-medium text-[var(--color-text)] text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border)]">
                                            {assignments.map(a => (
                                                <tr key={a.id} className="hover:bg-[var(--color-surface-hover)]">
                                                    <td className="py-2.5 truncate max-w-[100px]" title={a.user?.email}>{a.user?.email}</td>
                                                    <td className="py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-[var(--color-text)] truncate max-w-[120px]" title={a.windowsAccount?.description || a.windowsAccount?.host}>{a.windowsAccount?.description || a.windowsAccount?.host}</span>
                                                            <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[120px]">{a.windowsAccount?.windows_username}@pratikbulut.local</span>
                                                            {a.expiresAt && <span className="text-xs text-amber-400 mt-0.5">{t('admin.expires')}: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <button
                                                            onClick={() => handleRevokeAssignment(a.id)}
                                                            className="text-red-400 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded border border-red-400/20 text-xs transition-colors"
                                                            title={t('admin.revokeAssignment')}
                                                        >
                                                            {t('common.revoke')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {assignments.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-6 text-center italic">{t('admin.noAssignments')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-between items-center mt-4">
                                        <button disabled={assignmentPage === 1} onClick={() => setAssignmentPage(p => p - 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.previous')}</button>
                                        <span className="text-xs text-[var(--color-text-muted)]">{t('common.page')} {assignmentPage} {t('common.pageOf')} {Math.ceil(totalAssignments / 10) || 1}</span>
                                        <button disabled={assignmentPage >= Math.ceil(totalAssignments / 10)} onClick={() => setAssignmentPage(p => p + 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.next')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Connected Servers (Full Width) */}
                {(currentRole === 'admin' || currentRole === 'manager') && (
                <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-medium">{t('admin.connectedServers') || 'Bağlı Sunucular'}</h2>
                        </div>
                        <button onClick={fetchHosts} className="text-sm px-3 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)] transition-colors shadow-sm">
                            {loadingHosts ? t('common.refreshing') : t('common.refresh')}
                        </button>
                    </div>
                    {loadingHosts && hosts.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">{t('common.loading')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium text-[var(--color-text)]">Sunucu Adı</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">IP Adresi</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">Durum</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">CPU</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">RAM</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">Son Görülme</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {hosts.map((h, idx) => {
                                        const isOnline = h.status === 'online';
                                        return (
                                        <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                                            <td className="py-2.5 font-medium text-[var(--color-text)]">{h.hostname}</td>
                                            <td className="py-2.5">{h.ipAddress || '-'}</td>
                                            <td className="py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="py-2.5">{h.cpuUsage != null ? `${h.cpuUsage.toFixed(1)}%` : '-'}</td>
                                            <td className="py-2.5">{h.ramUsage != null ? `${h.ramUsage.toFixed(1)}%` : '-'}</td>
                                            <td className="py-2.5">{new Date(h.lastSeen).toLocaleString()}</td>
                                        </tr>
                                    )})}
                                    {hosts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center italic">Bağlı sunucu bulunamadı.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                )}

                {/* Live RDP Sessions (Full Width) */}
                <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-medium">{t('admin.liveRdpSessions')}</h2>
                            <input type="text" placeholder={t('common.search')} value={liveSessionSearch} onChange={e => setLiveSessionSearch(e.target.value)} className="bg-[var(--color-background)] rounded px-3 py-1 text-sm border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]" />
                        </div>
                        <button onClick={fetchActiveSessions} className="text-sm px-3 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)] transition-colors shadow-sm">
                            {loadingSessions ? t('common.refreshing') : t('common.refresh')}
                        </button>
                    </div>
                    {loadingSessions && activeSessions.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">{t('admin.loadingLiveSessions')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.username')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.sessionName')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">ID</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.state')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.idleTime')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.logonTime')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredLiveSessions.map((session, idx) => (
                                        <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                                            <td className="py-2.5 flex items-center gap-2">
                                                {session.username}
                                                {session.isCurrent && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{t('common.you')}</span>}
                                            </td>
                                            <td className="py-2.5">{session.sessionname}</td>
                                            <td className="py-2.5">{session.id}</td>
                                            <td className="py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-xs ${session.state.toLowerCase() === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {session.state}
                                                </span>
                                            </td>
                                            <td className="py-2.5">{session.idleTime}</td>
                                            <td className="py-2.5">{session.logonTime}</td>
                                        </tr>
                                    ))}
                                    {activeSessions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center italic">{t('admin.noActiveSessions')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Audit Logs (Full Width) */}
                {(currentRole === 'admin' || currentRole === 'manager') && (
                    <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium">{t('admin.auditTrails')}</h2>
                            <button onClick={fetchAuditLogs} className="text-sm px-3 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)] transition-colors shadow-sm">
                                {t('common.refresh')}
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--color-text-muted)]">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.auditDate')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.auditAction')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.auditActor')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.auditTarget')}</th>
                                        <th className="pb-3 font-medium text-[var(--color-text)]">{t('admin.auditDetails')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[var(--color-surface-hover)]">
                                            <td className="py-2.5">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="py-2.5">
                                                <span className="bg-gray-500/10 text-[var(--color-text)] px-2 py-0.5 rounded text-xs font-medium">
                                                    {log.actionId}
                                                </span>
                                            </td>
                                            <td className="py-2.5">{log.actor?.email || t('admin.auditSystem')}</td>
                                            <td className="py-2.5">{log.target?.email || '-'}</td>
                                            <td className="py-2.5 text-xs truncate max-w-[200px]" title={log.metadata}>
                                                {log.metadata ? log.metadata : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center italic">{t('admin.noAuditLogs')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center mt-4">
                                <button disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.previous')}</button>
                                <span className="text-xs text-[var(--color-text-muted)]">{t('common.page')} {auditPage} {t('common.pageOf')} {Math.ceil(totalAuditLogs / 10) || 1}</span>
                                <button disabled={auditPage >= Math.ceil(totalAuditLogs / 10)} onClick={() => setAuditPage(p => p + 1)} className="px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm disabled:opacity-50">{t('common.next')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
