import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../dashboard/components/Sidebar';
import DashboardNavbar from '../dashboard/components/Navbar';
import StatsCard from '../dashboard/components/Statscard';
import TransactionTable from '../dashboard/components/TransactiontableV3';
import AddTransactionForm from '../dashboard/components/AddtransactionformV2';
import BranchNoticesPage from '../dashboard/components/BranchNoticesPage';
import BranchExpensesPage from '../dashboard/components/BranchExpensesPage';
import DownloadReportButton from './components/DownloadReportButton';
import '../styles/dashboard.css';


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const POLL_MS = 20000; // 20-second refresh
const BRANCH_DEFAULT_PATH = '/branch';
const BRANCH_ALLOWED_PATHS = new Set([
  '/branch',
  '/branch/add',
  '/branch/transactions',
  '/branch/notices',
  '/branch/expenses',
  '/branch/reports',
  '/branch/settings',
]);


/* ── Shared UI Components ── */
const SectionCard = ({ title, desc, children }) => (
  <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 18 }}>
    {title && (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>{title}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>{desc}</div>}
      </div>
    )}
    {children}
  </div>
);

const FieldRow = ({ label, hint, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
      {hint && <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div style={{ flexShrink: 0, minWidth: 180, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    role="switch" aria-checked={checked} tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background .25s',
      background: checked ? 'var(--purple, #7c3aed)' : 'var(--border)',
      border: '1px solid ' + (checked ? 'var(--purple,#7c3aed)' : 'rgba(255,255,255,0.15)'),
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: checked ? 22 : 2, width: 18, height: 18,
      borderRadius: '50%', background: '#fff', transition: 'left .22s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </div>
);

const TextInput = ({ value, onChange, type = 'text', placeholder }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ background: 'var(--input-bg,rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: '100%', outline: 'none' }} />
);

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: '100%', cursor: 'pointer' }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const BranchDashboard = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const branchPathStorageKey = `branch_active_path_${user?.id || user?._id || user?.email || 'default'}`;
  const [activePath, setActivePath] = useState(() => {
    try {
      const savedPath = localStorage.getItem(`branch_active_path_${user?.id || user?._id || user?.email || 'default'}`);
      return savedPath && BRANCH_ALLOWED_PATHS.has(savedPath) ? savedPath : BRANCH_DEFAULT_PATH;
    } catch {
      return BRANCH_DEFAULT_PATH;
    }
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [portals, setPortals] = useState([]);
  const [notices, setNotices] = useState([]);
  const stablePortals = React.useMemo(() => portals, [portals]);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('branch_theme') || 'dark');

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;

  useEffect(() => {
    // Set data-theme on both <html> and <body> so the injected CSS below
    // can override every CSS variable regardless of where they are defined.
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.body.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('branch_theme', theme);
  }, [theme, resolvedTheme]);

  // ── Favourite Tabs ─────────────────────────────────────────────────────────
  const ALL_TABS = [
    { icon: '🏠', label: 'My Dashboard',    path: '/branch' },
    { icon: '➕', label: 'Add Transaction', path: '/branch/add' },
    { icon: '📋', label: 'My Transactions', path: '/branch/transactions' },
    { icon: '📢', label: 'Notices', path: '/branch/notices' },
    { icon: '💸', label: 'Expenses',        path: '/branch/expenses' },
    { icon: '📊', label: 'My Reports',      path: '/branch/reports' },
  ];

  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('branch_favs') || '[]'); } catch { return []; }
  });

  const toggleFavourite = (path) => {
    setFavourites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      localStorage.setItem('branch_favs', JSON.stringify(next));
      return next;
    });
  };

  // ── Settings State ─────────────────────────────────────────────────────────
  const [settingsTab, setSettingsTab]     = useState('profile');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [passwordForm, setPasswordForm]   = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg]     = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [settings, setSettings] = useState({
    managerName:    user?.name  || 'Branch Manager',
    managerEmail:   user?.email || '',
    managerPhone:   '',
    pollInterval:   20,
    dateFormat:     'DD/MM/YYYY',
    timezone:       'Asia/Kolkata',
    notifyNewTxn:   true,
    notifyLowProfit:false,
    emailNotify:    true,
    sessionTimeout: 60,
    twoFactor:      false,
    compactMode:    false,
    showAnimations: true,
  });

  const updateSetting = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current)             { setPasswordMsg('⚠️ Enter your current password.'); return; }
    if (passwordForm.newPass.length < 6)   { setPasswordMsg('⚠️ New password must be at least 6 characters.'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('⚠️ Passwords do not match.'); return; }
    
    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      const userId = user?.id || user?._id;
      await axios.patch(`${API}/users/${userId}/change-password`, {
        currentPassword: passwordForm.current,
        newPassword:     passwordForm.newPass,
      });
      setPasswordMsg('✅ Password changed successfully!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPasswordMsg(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordMsg(`❌ ${msg}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * branch object comes directly from user data set by Login
   * When a branch user logs in, authController fetches their assigned branch from database
  */
  const branch = user?.branch || {};
  const noticeReadStorageKey = `branch_notice_reads_${user?.id || user?._id || user?.email || 'guest'}`;
  const [readNoticeIds, setReadNoticeIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(noticeReadStorageKey) || '[]');
    } catch {
      return [];
    }
  });

  const fetchNotices = async () => {
    try {
      const { data } = await axios.get(`${API}/notices`);
      setNotices(data.data || []);
    } catch (err) {
      console.error('Failed to fetch notices', err);
    }
  };

  const markNoticeNotificationsRead = React.useCallback((ids = []) => {
    if (!ids.length) return;

    setReadNoticeIds((prev) => {
      const next = [...new Set([...prev, ...ids])];
      localStorage.setItem(noticeReadStorageKey, JSON.stringify(next));
      return next;
    });
  }, [noticeReadStorageKey]);

  const pollRef = useRef(null);

  /* ── Fetch transactions for THIS branch ── */
  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${API}/transactions?branch_id=${branch.id}`);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching branch transactions:', err);
      setTransactions([]);
    } finally {
      if (!silent) setLoading(false);
      setLastRefreshed(new Date());
    }
  }, [branch.id]);



  const fetchPortals = async () => {
    try {
      const { data } = await axios.get(`${API}/portals`);
      setPortals(data);
    } catch (err) {
      console.error('Failed to fetch portals', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchNotices();
    fetchPortals(); // 👈 ADD THIS
  }, [fetchTransactions]);



  useEffect(() => {
    if (!BRANCH_ALLOWED_PATHS.has(activePath)) {
      setActivePath(BRANCH_DEFAULT_PATH);
      return;
    }

    localStorage.setItem(branchPathStorageKey, activePath);
  }, [activePath, branchPathStorageKey]);

  // Live polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchTransactions(true);
      fetchNotices();
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchTransactions]);

  /* ── Add transaction ── */
  const handleTransactionAdded = async (newTxn) => {
    setTransactions(prev => [{
      ...newTxn,
      branch_name: branch.name,
    }, ...prev.filter((txn) => txn.id !== newTxn.id)]);

    await fetchTransactions(true);
  };

  /* ── Delete transaction ── */
  const handleDeleteTransaction = async (id) => {
    try { await axios.delete(`${API}/transactions/${id}`); } catch { /* demo */ }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  /* ── Metrics ── */
  const metrics = React.useMemo(() => {
    const totalAmount = transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalCharges = transactions.reduce((s, t) => s + Number(t.charges || 0), 0);
    const totalPortal = transactions.reduce((s, t) => s + Number(t.portal_charges || 0), 0);
    const netProfit = transactions.reduce((s, t) => s + Number(t.profit || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayTxns = transactions.filter(t => t.date === today);
    return { totalAmount, totalCharges, totalPortal, netProfit, count: transactions.length, todayCount: todayTxns.length, todayProfit: todayTxns.reduce((s, t) => s + Number(t.profit || 0), 0) };
  }, [transactions]);

  const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  /* ── Portal breakdown ── */
  const portalBreakdown = React.useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (!map[t.portal]) map[t.portal] = { count: 0, profit: 0 };
      map[t.portal].count++;
      map[t.portal].profit += Number(t.profit || 0);
    });
    return Object.entries(map)
      .map(([portal, d]) => ({ portal, ...d }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [transactions]);

  /* ── Nav items ── */
  const favTabItems = ALL_TABS.filter(t => favourites.includes(t.path));

  const navGroups = [
    ...(favTabItems.length > 0 ? [{
      section: '⭐ Favourites',
      items: favTabItems,
    }] : []),
    {
      section: 'Operations', items: [
        { icon: '🏠', label: 'My Dashboard',    path: '/branch' },
        { icon: '➕', label: 'Add Transaction',  path: '/branch/add' },
        { icon: '📋', label: 'My Transactions',  path: '/branch/transactions' },
        { icon: '📢', label: 'Notices', path: '/branch/notices' },
        { icon: '💸', label: 'Expenses',         path: '/branch/expenses' },
      ]
    },
    {
      section: 'Account', items: [
        { icon: '📊', label: 'My Reports', path: '/branch/reports' },
        { icon: '⚙️', label: 'Settings',   path: '/branch/settings' },
      ]
    },
  ];

  const getBreadcrumbs = () => ({
    '/branch':              [branch.name, 'Dashboard'],
    '/branch/add':          [branch.name, 'Add Transaction'],
    '/branch/transactions': [branch.name, 'Transactions'],
    '/branch/notices':      [branch.name, 'Notices'],
    '/branch/expenses':     [branch.name, 'Expenses'],
    '/branch/reports':      [branch.name, 'Reports'],
    '/branch/settings':     [branch.name, 'Settings'],
  }[activePath] || [branch.name]);

  /* ── Sidebar ── */
  const noticeNotifications = React.useMemo(() => (
    notices.slice(0, 6).map((notice) => ({
      id: notice._id,
      icon: notice.emoji || '📢',
      text: notice.title,
      time: new Date(notice.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      unread: !readNoticeIds.includes(notice._id),
    }))
  ), [notices, readNoticeIds]);

  const unreadNoticeCount = noticeNotifications.filter((notice) => notice.unread).length;

  useEffect(() => {
    if (activePath === '/branch/notices' && notices.length > 0) {
      markNoticeNotificationsRead(notices.map((notice) => notice._id));
    }
  }, [activePath, notices, markNoticeNotificationsRead]);

  const SidebarEl = () => (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileSidebarOpen ? ' mobile-open' : ''}`} aria-label="Branch sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">₹</div>
        <span className="brand-text">Cash<em>flow</em></span>
      </div>

      {/* Branch name strip */}
      <div style={{
        padding: collapsed ? '10px' : '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        transition: 'all 0.3s',
      }}>
        {!collapsed && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(219,212,255,0.2), rgba(128,128,52,0.1))',
            borderRadius: 8,
            padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Active Branch
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏢 {branch.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              📍 {branch.location}
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.section} style={{ marginBottom: 8 }}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <div
                key={item.path}
                className={`nav-item${activePath === item.path ? ' active' : ''}`}
                onClick={() => { setActivePath(item.path); setMobileSidebarOpen(false); }}
                title={collapsed ? item.label : undefined}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActivePath(item.path)}
              >
                <div className="nav-icon">{item.icon}</div>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={onLogout} role="button" tabIndex={0} style={{ marginBottom: 8, color: 'rgba(255,100,80,0.75)' }}>
          <div className="nav-icon">🚪</div>
          <span className="nav-label">Logout</span>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--olive), #a0a040)' }}>
            {(user?.name || 'B').slice(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Branch Manager'}</div>
            <div className="user-role">{branch.name}</div>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ── Settings Page ── */
  const SettingsPage = () => {
    const tabs = [
      { id: 'profile',       icon: '👤', label: 'Profile' },
      { id: 'appearance',    icon: '🎨', label: 'Appearance' },
      { id: 'favourites',    icon: '⭐', label: 'Favourites' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' },
      { id: 'system',        icon: '⚙️', label: 'System' },
      { id: 'security',      icon: '🔒', label: 'Security' },
    ];

    return (
      <>
        <div className="page-header">
          <span className="page-tag">Configuration</span>
          <h1 className="page-title">{branch.name} <span>Settings</span></h1>
          <p className="page-desc">Manage your profile, appearance, favourites and security preferences.</p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 6 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9,
                border: 'none', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, transition: 'all .2s',
                background: settingsTab === tab.id ? 'var(--purple,#7c3aed)' : 'transparent',
                color: settingsTab === tab.id ? '#fff' : 'var(--text-2)',
              }}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile ── */}
        {settingsTab === 'profile' && (
          <>
            <SectionCard title="Branch Manager Profile" desc="Update your contact details shown in reports.">
              <FieldRow label="Full Name" hint="Displayed in dashboard header">
                <TextInput value={settings.managerName} onChange={v => updateSetting('managerName', v)} placeholder="Your name" />
              </FieldRow>
              <FieldRow label="Email Address" hint="For system notifications">
                <TextInput value={settings.managerEmail} onChange={v => updateSetting('managerEmail', v)} type="email" placeholder="you@cashflow.in" />
              </FieldRow>
              <FieldRow label="Phone Number" hint="Optional — used for alerts">
                <TextInput value={settings.managerPhone} onChange={v => updateSetting('managerPhone', v)} placeholder="+91 9876543210" />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Change Password" desc="Use at least 6 characters with a mix of letters and numbers.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ label: 'Current Password', key: 'current' }, { label: 'New Password', key: 'newPass' }, { label: 'Confirm Password', key: 'confirm' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 5 }}>{f.label}</div>
                    <input type="password" value={passwordForm[f.key]}
                      onChange={e => {
                        const val = e.target.value;
                        setPasswordForm(p => ({ ...p, [f.key]: val }));
                      }}
                      autoComplete={f.key === 'current' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      style={{ background: 'var(--input-bg,rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: '100%' }} />
                  </div>
                ))}
                {passwordMsg && <div style={{ fontSize: '0.82rem', color: passwordMsg.startsWith('✅') ? 'var(--green)' : passwordMsg.startsWith('⚠️') ? 'var(--amber,#b06a00)' : 'var(--red)', fontWeight: 600 }}>{passwordMsg}</div>}
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? '⏳ Updating…' : '🔑 Update Password'}
                </button>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Appearance ── */}
        {settingsTab === 'appearance' && (
          <>
            <SectionCard title="Theme" desc="Choose how the dashboard looks. Changes apply instantly.">
              <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                {[
                  { val: 'dark',   label: '🌙 Dark',   desc: 'Easy on eyes at night' },
                  { val: 'light',  label: '☀️ Light',  desc: 'Bright & clean' },
                  { val: 'system', label: '💻 System', desc: 'Follow device setting' },
                ].map(opt => (
                  <div key={opt.val} onClick={() => setTheme(opt.val)}
                    style={{
                      flex: '1 1 140px', padding: '16px 18px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                      border: theme === opt.val ? '2px solid var(--purple,#7c3aed)' : '2px solid var(--border)',
                      background: theme === opt.val ? 'rgba(124,58,237,0.12)' : 'var(--panel)',
                    }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{opt.label.split(' ')[0]}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)' }}>{opt.label.split(' ').slice(1).join(' ')}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: 3 }}>{opt.desc}</div>
                    {theme === opt.val && <div style={{ fontSize: '0.72rem', color: 'var(--purple,#7c3aed)', fontWeight: 700, marginTop: 6 }}>✓ Active</div>}
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Interface Options">
              <FieldRow label="Compact Mode" hint="Reduce spacing to show more data at once">
                <Toggle checked={settings.compactMode} onChange={v => updateSetting('compactMode', v)} />
              </FieldRow>
              <FieldRow label="Animations" hint="Smooth transitions and micro-interactions">
                <Toggle checked={settings.showAnimations} onChange={v => updateSetting('showAnimations', v)} />
              </FieldRow>
            </SectionCard>
          </>
        )}

        {/* ── Favourites ── */}
        {settingsTab === 'favourites' && (
          <SectionCard title="Quick Access Favourites" desc="Pinned tabs appear at the top of your sidebar for one-click navigation.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {ALL_TABS.map(tab => {
                const isFav = favourites.includes(tab.path);
                return (
                  <div key={tab.path}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 10, transition: 'all .2s',
                      border: `1px solid ${isFav ? 'var(--purple,#7c3aed)' : 'var(--border)'}`,
                      background: isFav ? 'rgba(124,58,237,0.08)' : 'transparent',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-1)' }}>{tab.label}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>{tab.path}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavourite(tab.path)}
                      className={isFav ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ minWidth: 100 }}>
                      {isFav ? '★ Unpin' : '☆ Pin to Sidebar'}
                    </button>
                  </div>
                );
              })}
            </div>
            {favourites.length > 0 && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(124,58,237,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                ⭐ {favourites.length} tab{favourites.length > 1 ? 's' : ''} pinned — visible in sidebar under <strong>Favourites</strong>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Notifications ── */}
        {settingsTab === 'notifications' && (
          <SectionCard title="Notification Preferences" desc="Choose which events trigger alerts for you.">
            {[
              { key: 'notifyNewTxn',    label: 'New Transaction Alert',  hint: 'Alert when a transaction is added' },
              { key: 'notifyLowProfit', label: 'Low Profit Warning',     hint: 'Alert when profit dips below threshold' },
              { key: 'emailNotify',     label: 'Email Notifications',    hint: 'Send alerts to your registered email' },
            ].map(item => (
              <FieldRow key={item.key} label={item.label} hint={item.hint}>
                <Toggle checked={settings[item.key]} onChange={v => updateSetting(item.key, v)} />
              </FieldRow>
            ))}
          </SectionCard>
        )}

        {/* ── System ── */}
        {settingsTab === 'system' && (
          <SectionCard title="System Preferences" desc="Configure refresh and display behaviour.">
            <FieldRow label="Live Refresh Interval" hint="How often transactions auto-refresh">
              <Select value={settings.pollInterval} onChange={v => updateSetting('pollInterval', Number(v))}
                options={[{ value: 10, label: '10 seconds' }, { value: 20, label: '20 seconds' }, { value: 60, label: '1 minute' }, { value: 300, label: '5 minutes' }]} />
            </FieldRow>
            <FieldRow label="Date Format" hint="Applies to all date displays">
              <Select value={settings.dateFormat} onChange={v => updateSetting('dateFormat', v)}
                options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
            </FieldRow>
            <FieldRow label="Timezone" hint="Used for timestamps">
              <Select value={settings.timezone} onChange={v => updateSetting('timezone', v)}
                options={[{ value: 'Asia/Kolkata', label: 'IST — Asia/Kolkata' }, { value: 'UTC', label: 'UTC' }]} />
            </FieldRow>
          </SectionCard>
        )}

        {/* ── Security ── */}
        {settingsTab === 'security' && (
          <>
            <SectionCard title="Session & Access" desc="Control how long you stay logged in.">
              <FieldRow label="Session Timeout" hint="Auto-logout after inactivity">
                <Select value={settings.sessionTimeout} onChange={v => updateSetting('sessionTimeout', Number(v))}
                  options={[{ value: 15, label: '15 minutes' }, { value: 30, label: '30 minutes' }, { value: 60, label: '1 hour' }, { value: 240, label: '4 hours' }]} />
              </FieldRow>
              <FieldRow label="Two-Factor Authentication" hint="Require OTP on every login (recommended)">
                <Toggle checked={settings.twoFactor} onChange={v => updateSetting('twoFactor', v)} />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Account Actions">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>📤 Export My Transactions</button>
                <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Logout Now</button>
              </div>
            </SectionCard>
          </>
        )}

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          {settingsSaved && <span style={{ fontSize: '0.83rem', color: 'var(--green)', fontWeight: 600 }}>✅ Settings saved!</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setActivePath('/branch')}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>💾 Save Changes</button>
        </div>
      </>
    );
  };

  /* ── Reports Page ── */
  const ReportsPage = () => {
    const [reportPeriod, setReportPeriod] = React.useState('month');
    const [reportTab, setReportTab] = React.useState('overview');

    const now = new Date();

    const filtered = React.useMemo(() => {
      const cutoff = new Date();
      if (reportPeriod === 'week')  cutoff.setDate(now.getDate() - 7);
      if (reportPeriod === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (reportPeriod === 'quarter') cutoff.setMonth(now.getMonth() - 3);
      if (reportPeriod === 'year')  cutoff.setFullYear(now.getFullYear() - 1);
      return transactions.filter(t => new Date(t.date) >= cutoff);
    }, [reportPeriod, transactions]);

    const rMetrics = React.useMemo(() => ({
      totalAmount:  filtered.reduce((s, t) => s + Number(t.amount  || 0), 0),
      totalCharges: filtered.reduce((s, t) => s + Number(t.charges || 0), 0),
      totalPortal:  filtered.reduce((s, t) => s + Number(t.portal_charges || 0), 0),
      netProfit:    filtered.reduce((s, t) => s + Number(t.profit  || 0), 0),
      count:        filtered.length,
    }), [filtered]);

    // Daily aggregation for trend chart
    const dailyData = React.useMemo(() => {
      const map = {};
      filtered.forEach(t => {
        const d = t.date?.split('T')[0] || t.date;
        if (!map[d]) map[d] = { date: d, amount: 0, profit: 0, count: 0 };
        map[d].amount += Number(t.amount || 0);
        map[d].profit += Number(t.profit || 0);
        map[d].count++;
      });
      return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    }, [filtered]);

    // Portal breakdown
    const portalData = React.useMemo(() => {
      const map = {};
      filtered.forEach(t => {
        const p = t.portal || 'Unknown';
        if (!map[p]) map[p] = { portal: p, count: 0, amount: 0, profit: 0 };
        map[p].count++;
        map[p].amount += Number(t.amount || 0);
        map[p].profit += Number(t.profit || 0);
      });
      return Object.values(map).sort((a, b) => b.profit - a.profit);
    }, [filtered]);

    const maxAmount = dailyData.length ? Math.max(...dailyData.map(d => d.amount), 1) : 1;
    const maxProfit = dailyData.length ? Math.max(...dailyData.map(d => d.profit), 1) : 1;
    const totalPortalAmount = portalData.reduce((s, p) => s + p.amount, 0) || 1;

    const COLORS = ['#7c3aed','#34d399','#f59e0b','#60a5fa','#f87171','#a78bfa'];

    const periodLabel = { week: 'Last 7 Days', month: 'Last 30 Days', quarter: 'Last 3 Months', year: 'Last 12 Months' }[reportPeriod];

    const SCard = ({ children, style = {} }) => (
      <div style={{ background: 'var(--panel,#1a1d27)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', ...style }}>
        {children}
      </div>
    );

    return (
      <>
        <div className="page-header">
          <span className="page-tag">Analytics</span>
          <h1 className="page-title">{branch.name} <span>Reports</span></h1>
          <p className="page-desc">Financial analytics and performance insights for your branch.</p>
        </div>

        {/* Period selector + Tab Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 5, flexWrap: 'wrap' }}>
            {[['week','7D'],['month','30D'],['quarter','90D'],['year','1Y']].map(([val, label]) => (
              <button key={val} onClick={() => setReportPeriod(val)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all .2s',
                  background: reportPeriod === val ? 'var(--primary,#723480)' : 'transparent',
                  color: reportPeriod === val ? '#fff' : 'var(--text-2)',
                }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 5, flexWrap: 'wrap' }}>
            {[['overview','📊 Overview'],['portals','🌐 Portals'],['trends','📈 Trends']].map(([val, label]) => (
              <button key={val} onClick={() => setReportTab(val)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all .2s',
                  background: reportTab === val ? 'var(--primary,#723480)' : 'transparent',
                  color: reportTab === val ? '#fff' : 'var(--text-2)',
                }}>{label}</button>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatsCard icon="💳" label="Total Volume"       value={fmtINR(rMetrics.totalAmount)}  trend={5.2}  color="purple" subText={`${rMetrics.count} transactions · ${periodLabel}`} />
          <StatsCard icon="📈" label="Service Charges"    value={fmtINR(rMetrics.totalCharges)} trend={5.2}  color="olive" />
          <StatsCard icon="📉" label="Portal Fees"        value={fmtINR(rMetrics.totalPortal)}  trend={-1.4} color="red" />
          <StatsCard icon="✅" label="Net Profit"         value={fmtINR(rMetrics.netProfit)}    trend={7.8}  color="green" subText={rMetrics.count > 0 ? `Avg ₹${Math.round(rMetrics.netProfit / rMetrics.count).toLocaleString('en-IN')}/txn` : '—'} />
        </div>

        {/* ── Overview Tab ── */}
        {reportTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Profit Breakdown donut-style */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>💰 Profit Breakdown</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 18 }}>{periodLabel}</div>
              {[
                { label: 'Total Volume', value: rMetrics.totalAmount, color: '#7c3aed', pct: 100 },
                { label: 'Service Charges', value: rMetrics.totalCharges, color: '#34d399', pct: rMetrics.totalAmount ? (rMetrics.totalCharges / rMetrics.totalAmount * 100) : 0 },
                { label: 'Portal Fees', value: rMetrics.totalPortal, color: '#f87171', pct: rMetrics.totalAmount ? (rMetrics.totalPortal / rMetrics.totalAmount * 100) : 0 },
                { label: 'Net Profit', value: rMetrics.netProfit, color: '#f59e0b', pct: rMetrics.totalAmount ? (rMetrics.netProfit / rMetrics.totalAmount * 100) : 0 },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{fmtINR(row.value)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(row.pct, 100)}%`, background: row.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 3 }}>{row.pct.toFixed(2)}% of volume</div>
                </div>
              ))}
            </SCard>

            {/* Summary metrics */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>📋 Period Summary</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 18 }}>{periodLabel}</div>
              {[
                { label: 'Transactions', value: rMetrics.count, icon: '🔢', unit: 'total' },
                { label: 'Avg Transaction', value: rMetrics.count ? fmtINR(rMetrics.totalAmount / rMetrics.count) : '₹0', icon: '📊', unit: 'per txn' },
                { label: 'Avg Daily Txns', value: dailyData.length ? (rMetrics.count / dailyData.length).toFixed(1) : '0', icon: '📅', unit: 'per day' },
                { label: 'Profit Margin', value: rMetrics.totalAmount ? ((rMetrics.netProfit / rMetrics.totalAmount) * 100).toFixed(2) + '%' : '0%', icon: '📈', unit: 'of volume' },
                { label: 'Top Portal', value: portalData[0]?.portal || '—', icon: '🌐', unit: 'by profit' },
                { label: 'Active Days', value: dailyData.length, icon: '📆', unit: 'with txns' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-1)' }}>{row.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{row.unit}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary,#723480)' }}>{row.value}</div>
                </div>
              ))}
            </SCard>

            {/* Recent transactions mini list */}
            <SCard style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>🕐 Recent Activity</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Last 5 transactions</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePath('/branch/transactions')}>View All →</button>
              </div>
              {filtered.slice(0, 5).map((t, i) => (
                <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>
                      {(t.portal || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{t.portal || 'Unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{t.date?.split('T')[0] || t.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>{fmtINR(t.amount)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green)' }}>+{fmtINR(t.profit)}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)', fontSize: '0.85rem' }}>No transactions in this period</div>}
            </SCard>
          </div>
        )}

        {/* ── Portals Tab ── */}
        {reportTab === 'portals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>🌐 Portal Performance</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 20 }}>{periodLabel} · {rMetrics.count} total transactions</div>
              {portalData.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No portal data for this period</div>}
              {portalData.map((p, i) => {
                const pct = (p.amount / totalPortalAmount * 100).toFixed(1);
                return (
                  <div key={p.portal} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{p.portal}</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>{p.count} txns</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>{fmtINR(p.amount)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--green)' }}>profit: {fmtINR(p.profit)}</div>
                      </div>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 3 }}>{pct}% of total volume</div>
                  </div>
                );
              })}
            </SCard>

            {/* Portal table */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 16 }}>📊 Portal Comparison Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr>
                      {['Portal', 'Transactions', 'Volume', 'Service Charges', 'Portal Fees', 'Net Profit', 'Margin'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Portal' ? 'left' : 'right', color: 'var(--text-3)', fontWeight: 700, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portalData.map((p, i) => {
                      const charges = filtered.filter(t => (t.portal || 'Unknown') === p.portal).reduce((s, t) => s + Number(t.charges || 0), 0);
                      const fees = filtered.filter(t => (t.portal || 'Unknown') === p.portal).reduce((s, t) => s + Number(t.portal_charges || 0), 0);
                      const margin = p.amount ? ((p.profit / p.amount) * 100).toFixed(2) : '0';
                      return (
                        <tr key={p.portal} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{p.portal}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--text-2)' }}>{p.count}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-1)' }}>{fmtINR(p.amount)}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--text-2)' }}>{fmtINR(charges)}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--red)' }}>{fmtINR(fees)}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>{fmtINR(p.profit)}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: 'var(--text-2)' }}>{margin}%</td>
                        </tr>
                      );
                    })}
                    {portalData.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SCard>
          </div>
        )}

        {/* ── Trends Tab ── */}
        {reportTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Volume bar chart */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>📈 Daily Volume Trend</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 20 }}>Last 14 active days · hover for details</div>
              {dailyData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>No data for this period</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, minWidth: Math.max(dailyData.length * 42, 300), padding: '0 4px' }}>
                    {dailyData.map((d, i) => {
                      const heightPct = (d.amount / maxAmount * 100);
                      const profitPct = (d.profit / maxAmount * 100);
                      return (
                        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', minWidth: 32 }}
                          title={`${d.date}\nVolume: ${fmtINR(d.amount)}\nProfit: ${fmtINR(d.profit)}\nTxns: ${d.count}`}>
                          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: 140 }}>
                            <div style={{ flex: 1, background: 'rgba(124,58,237,0.3)', borderRadius: '4px 4px 0 0', height: `${heightPct}%`, minHeight: 4, transition: 'height 0.4s ease', position: 'relative' }}>
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#7c3aed', borderRadius: '4px 4px 0 0', height: `${profitPct / heightPct * 100}%`, minHeight: 2 }} />
                            </div>
                          </div>
                          <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', whiteSpace: 'nowrap', transform: 'rotate(-40deg)', transformOrigin: 'top center', marginTop: 4 }}>
                            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(124,58,237,0.3)' }} /> Volume</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#7c3aed' }} /> Net Profit</div>
                  </div>
                </div>
              )}
            </SCard>

            {/* Profit trend */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>💹 Profit Trend</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 20 }}>Daily net profit over last 14 active days</div>
              {dailyData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No data for this period</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: Math.max(dailyData.length * 48, 300) }}>
                    {dailyData.map((d, i) => {
                      const pct = (d.profit / maxProfit * 100);
                      return (
                        <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <div style={{ width: 72, fontSize: '0.72rem', color: 'var(--text-3)', flexShrink: 0, textAlign: 'right' }}>
                            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                          <div style={{ flex: 1, height: 22, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #34d399, #059669)', borderRadius: 4, transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: pct > 10 ? 'auto' : 0 }}>
                              {pct > 15 && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{fmtINR(d.profit)}</span>}
                            </div>
                          </div>
                          <div style={{ width: 68, fontSize: '0.78rem', color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>{fmtINR(d.profit)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </SCard>

            {/* Transaction count trend */}
            <SCard>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)', marginBottom: 4 }}>🔢 Transaction Count</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 16 }}>Daily transaction count</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dailyData.map((d, i) => {
                  const maxCount = Math.max(...dailyData.map(x => x.count), 1);
                  const intensity = d.count / maxCount;
                  return (
                    <div key={d.date} title={`${d.date}: ${d.count} txns`}
                      style={{
                        width: 42, height: 42, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'default',
                        background: `rgba(124,58,237,${0.08 + intensity * 0.6})`,
                        border: '1px solid rgba(124,58,237,0.15)',
                      }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: intensity > 0.5 ? '#fff' : 'var(--text-1)' }}>{d.count}</div>
                      <div style={{ fontSize: '0.55rem', color: intensity > 0.5 ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>
                        {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
                {dailyData.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>No data for this period</div>}
              </div>
            </SCard>
          </div>
        )}
      </>
    );
  };

  /* ── Add Transaction Page ── */
 const AddTransactionPage = React.useMemo(() => () => (
  <>
    <div className="page-header">
      <span className="page-tag">Operations</span>
      <h1 className="page-title">{branch.name} <span>Add Transaction</span></h1>
      <p className="page-desc">Record a new transaction for your branch.</p>
    </div>

    <div style={{ maxWidth: 600 }}>
      <AddTransactionForm
        branchId={branch.id}
        apiBase={API}
        portals={stablePortals}
        onSuccess={(txn) => {
          handleTransactionAdded(txn);
          setActivePath('/branch/transactions');
        }}
      />
    </div>
  </>
), [branch.id, branch.name, stablePortals]);

  /* ── My Transactions Page ── */
  const TransactionsPage = () => {
    const [search, setSearch] = React.useState('');
    const [filterPortal, setFilterPortal] = React.useState('');
    const [filterDate, setFilterDate] = React.useState('');

    const portalsInData = [...new Set(transactions.map(t => t.portal).filter(Boolean))];

    const filtered = transactions.filter(t => {
      const matchSearch = !search || (t.portal || '').toLowerCase().includes(search.toLowerCase()) || String(t.amount).includes(search);
      const matchPortal = !filterPortal || t.portal === filterPortal;
      const matchDate   = !filterDate   || (t.date || '').startsWith(filterDate);
      return matchSearch && matchPortal && matchDate;
    });

    return (
      <>
        <div className="page-header">
          <span className="page-tag">Finance</span>
          <h1 className="page-title">{branch.name} <span>Transactions</span></h1>
          <p className="page-desc">
            All transactions for your branch.
            {lastRefreshed && <span style={{ marginLeft: 8, fontSize: '0.73rem', color: 'var(--green)' }}>● Live · {lastRefreshed.toLocaleTimeString('en-IN')}</span>}
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, padding: '14px 18px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <input
            type="text" placeholder="🔍 Search portal or amount…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 180px', background: 'var(--input-bg,rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.83rem', outline: 'none', minWidth: 0 }}
          />
          <select value={filterPortal} onChange={e => setFilterPortal(e.target.value)}
            style={{ flex: '1 1 140px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.83rem', cursor: 'pointer', minWidth: 0 }}>
            <option value="">All Portals</option>
            {portalsInData.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ flex: '1 1 140px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.83rem', minWidth: 0 }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(search || filterPortal || filterDate) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterPortal(''); setFilterDate(''); }}>✕ Clear</button>
            )}
            <DownloadReportButton branchId={branch?.id} />
            <button className="btn btn-ghost btn-sm" onClick={() => fetchTransactions()}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => setActivePath('/branch/add')}>➕ Add New</button>
          </div>
        </div>

        <div style={{ marginBottom: 10, fontSize: '0.8rem', color: 'var(--text-3)' }}>
          Showing {filtered.length} of {transactions.length} transactions
        </div>

        <TransactionTable
          transactions={filtered}
          branches={[]}
          showBranchColumn={false}
          loading={loading}
          onDelete={handleDeleteTransaction}
        />
      </>
    );
  };

  /* ── Page switcher ── */
  const renderPage = () => {
    if (activePath === '/branch/settings')      return SettingsPage();
    if (activePath === '/branch/reports')       return <ReportsPage />;
    if (activePath === '/branch/add')           return <AddTransactionPage />;
    if (activePath === '/branch/transactions')  return <TransactionsPage />;
    if (activePath === '/branch/expenses') {
      return (
        <BranchExpensesPage
          branchId={branch.id}
          branchName={branch.name}
        />
      );
    }
    if (activePath === '/branch/notices') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Communication</span>
            <h1 className="page-title">{branch.name} <span>Notices</span></h1>
            <p className="page-desc">View admin notices and react to them from your branch dashboard.</p>
          </div>
          <BranchNoticesPage
            user={user}
            onNoticesLoaded={(nextNotices) => {
              setNotices(nextNotices);
              markNoticeNotificationsRead(nextNotices.map((notice) => notice._id));
            }}
          />
        </>
      );
    }
    return null; // falls through to inline main content (dashboard home)
  };

  /* ── Main render ── */
  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 150, backdropFilter: 'blur(3px)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <SidebarEl />

      <div className={`main-area${collapsed ? ' sidebar-collapsed' : ''}`}>
        <DashboardNavbar
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) setMobileSidebarOpen(o => !o);
            else setCollapsed(c => !c);
          }}
          breadcrumbs={getBreadcrumbs()}
          userName={user?.name || 'Branch Manager'}
          role="branch"
          notificationCount={unreadNoticeCount}
          notifications={noticeNotifications}
          onLogout={onLogout}
          onNavigate={(path) => { setActivePath(path); setMobileSidebarOpen(false); }}
        />

        <main className="page-content">
          {activePath !== '/branch' ? renderPage() : (
          <>
          {/* Page Header — uses branch.name dynamically */}
          <div className="page-header">
            <span className="page-tag">Branch Panel</span>
            <h1 className="page-title">
              {branch.name} <span>Dashboard</span>
            </h1>
            <p className="page-desc">
              📍 {branch.location} · Manage your transactions
              {lastRefreshed && (
                <span style={{ marginLeft: 8, fontSize: '0.73rem', color: 'var(--green)' }}>
                  ● Live · {lastRefreshed.toLocaleTimeString('en-IN')}
                </span>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatsCard icon="💳" label="Total Volume" value={fmtINR(metrics.totalAmount)} trend={5.2} color="purple" subText={`${metrics.count} transactions`} />
            <StatsCard icon="📈" label="Charges (2.5%)" value={fmtINR(metrics.totalCharges)} trend={5.2} color="olive" />
            <StatsCard icon="📉" label="Portal Fees (1.8%)" value={fmtINR(metrics.totalPortal)} trend={-1.4} color="red" />
            <StatsCard icon="💰" label="Net Profit (0.7%)" value={fmtINR(metrics.netProfit)} trend={7.8} color="green"
              subText={`Today: ${metrics.todayCount} txn · ${fmtINR(metrics.todayProfit)}`}
            />
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setActivePath('/branch/add')}>➕ Add Transaction</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePath('/branch/transactions')}>📋 View All Transactions</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePath('/branch/reports')}>📊 View Reports</button>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchTransactions()}>🔄 Refresh</button>
            <DownloadReportButton branchId={branch?.id} />
          </div>

          {/* Two-column: table + form */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 340px', gap: 24, minWidth: 0, alignItems: 'start' }} className="branch-main-grid">
            {/* Left: recent transactions */}
            <div style={{ minWidth: 0 }}>
              <div className="section-header">
                <div>
                  <div className="section-title">{branch.name} — Recent Transactions</div>
                  <div className="section-subtitle">{transactions.length} total records</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePath('/branch/transactions')} style={{marginRight:'200px'}}>View All →</button>
              </div>
              <TransactionTable
                transactions={transactions.slice(0, 10)}
                branches={[]}
                showBranchColumn={false}
                loading={loading}
                onDelete={handleDeleteTransaction}
              />
            </div>

            {/* Right: portal breakdown */}
            {/* <div style={{ minWidth: 0 }}>
              <div className="section-header">
                <div>
                  <div className="section-title">Portal Breakdown</div>
                  <div className="section-subtitle">Top 5 portals by profit</div>
                </div>
              </div>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
                {portalBreakdown.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)', fontSize: '0.83rem' }}>No transactions yet</div>}
                {portalBreakdown.map((p, i) => {
                  const COLORS = ['#7c3aed','#34d399','#f59e0b','#60a5fa','#f87171'];
                  const maxProfit = portalBreakdown[0]?.profit || 1;
                  return (
                    <div key={p.portal} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                          {p.portal}
                        </span>
                        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtINR(p.profit)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(p.profit / maxProfit) * 100}%`, background: COLORS[i], borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 2 }}>{p.count} transactions</div>
                    </div>
                  );
                })}
              </div>
            </div> */}
          </div>
          </>)}
        </main>
      </div>

      {/* ── Theme CSS + Responsive ── */}
      <style>{`
        /* ── LIGHT THEME overrides ───────────────────────────────────────── */
        html[data-theme="light"],
        body[data-theme="light"] {
          background-color: #f0f2f6 !important;
          color: #0f1117 !important;
        }
        [data-theme="light"] {
          --bg:            #f0f2f6 !important;
          --panel:         #ffffff !important;
          --panel-2:       #f7f8fa !important;
          --border:        #dde1e8 !important;
          --border-strong: #c4c9d4 !important;
          --text-1:        #0f1117 !important;
          --text-2:        #374151 !important;
          --text-3:        #6b7280 !important;
          --input-bg:      rgba(0,0,0,0.04) !important;
          color-scheme: light;
        }
        [data-theme="light"] .app-shell,
        [data-theme="light"] .main-area,
        [data-theme="light"] .page-content { background: #f0f2f6 !important; }
        [data-theme="light"] .panel,
        [data-theme="light"] .stats-card,
        [data-theme="light"] .branch-card,
        [data-theme="light"] .modal        { background: #ffffff !important; border-color: #dde1e8 !important; }
        [data-theme="light"] .dashboard-navbar,
        [data-theme="light"] .navbar        { background: #ffffff !important; border-bottom-color: #dde1e8 !important; }
        [data-theme="light"] table          { background: #ffffff !important; }
        [data-theme="light"] thead tr,
        [data-theme="light"] th             { background: #f3f4f6 !important; color: #374151 !important; }
        [data-theme="light"] tbody tr:hover { background: #f9fafb !important; }
        [data-theme="light"] td             { color: #374151 !important; border-color: #e5e7eb !important; }
        [data-theme="light"] input,
        [data-theme="light"] select,
        [data-theme="light"] textarea       { background: #ffffff !important; color: #111827 !important; border-color: #d1d5db !important; }
        [data-theme="light"] .btn-ghost     { color: #374151 !important; border-color: #d1d5db !important; }
        [data-theme="light"] .btn-ghost:hover { background: #f3f4f6 !important; }
        [data-theme="light"] .page-title    { color: #0f1117 !important; }
        [data-theme="light"] .page-desc,
        [data-theme="light"] .section-subtitle { color: #6b7280 !important; }
        [data-theme="light"] .section-title { color: #111827 !important; }
        [data-theme="light"] .section-header { border-color: #e5e7eb !important; }
        [data-theme="light"] .page-tag      { background: rgba(124,58,237,0.1) !important; color: #7c3aed !important; }
        [data-theme="light"] .nav-section-label { color: #9ca3af !important; }
        [data-theme="light"] .skeleton      { background: linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%) !important; }
        /* ── DARK (explicit) ─────────────────────────────────────────────── */
        [data-theme="dark"] { color-scheme: dark; }
        /* ── Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 960px) {
          .branch-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BranchDashboard;