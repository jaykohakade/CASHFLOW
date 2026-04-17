import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../dashboard/components/Sidebar';
import DashboardNavbar from '../dashboard/components/Navbar';
import StatsCard from '../dashboard/components/Statscard';
import TransactionTable from '../dashboard/components/TransactiontableV3';
import AddTransactionForm from '../dashboard/components/AddtransactionformV2';
import UsersPage from '../dashboard/Userspage';
import Noticespage from '../dashboard/components/Noticespage';
import PortalPage from '../dashboard/components/Portalpage';   // ← NEW
import AdminExpensesPage from '../dashboard/components/AdminExpensesPage';
import AdminEnquiriesPage from '../dashboard/components/AdminEnquiriesPage';
import DownloadReportButton from './components/DownloadReportButton';
import '../styles/dashboard.css';
import '../styles/form.css';
import '../styles/Portal.css';                       // ← NEW

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const POLL_MS = 30000; // 30-second live refresh
const ADMIN_DEFAULT_PATH = '/admin';
const ADMIN_ALLOWED_PATHS = new Set([
  '/admin',
  '/admin/branches',
  '/admin/transactions',
  '/admin/users',
  '/admin/portals',
  '/admin/notices',
  '/admin/expenses',
  '/admin/enquiries',
  '/admin/analytics',
  '/admin/settings',
]);

/* ── Shared UI Components ── */
const SectionCard = ({ title, desc, children }) => (
  <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 18 }}>
    {title && <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>{title}</div>
      {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>{desc}</div>}
    </div>}
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
      border: '1px solid ' + (checked ? 'var(--purple, #7c3aed)' : 'var(--border-strong, #444)'),
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: checked ? 22 : 2, width: 18, height: 18,
      borderRadius: '50%', background: '#fff', transition: 'left .22s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }} />
  </div>
);

const Input = ({ value, onChange, type = 'text', placeholder }) => (
  <input
    type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      background: 'var(--input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border)',
      borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem',
      width: '100%', outline: 'none',
    }}
  />
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)}
    style={{
      background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8,
      padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: '100%', cursor: 'pointer',
    }}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const AdminDashboard = ({ user, onLogout }) => {
  const [collapsed,       setCollapsed]       = useState(false);
  const adminPathStorageKey = `admin_active_path_${user?.id || user?._id || user?.email || 'default'}`;
  const [activePath,      setActivePath]      = useState(() => {
    try {
      const savedPath = localStorage.getItem(`admin_active_path_${user?.id || user?._id || user?.email || 'default'}`);
      return savedPath && ADMIN_ALLOWED_PATHS.has(savedPath) ? savedPath : ADMIN_DEFAULT_PATH;
    } catch {
      return ADMIN_DEFAULT_PATH;
    }
  });
  const [transactions,    setTransactions]    = useState([]);
  const [branches,        setBranches]        = useState([]);
  const [loadingTxns,     setLoadingTxns]     = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [lastRefreshed,   setLastRefreshed]   = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Profile
    adminName: user?.name || 'Admin',
    adminEmail: user?.email || 'admin@cashflow.in',
    adminPhone: '',
    // System
    pollInterval: 30,
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    // Charges
    chargeRate: 2.5,
    portalRate: 1.8,
    // Notifications
    notifyNewTxn: true,
    notifyBranchAdded: true,
    notifyLowProfit: false,
    emailNotify: true,
    // Security
    sessionTimeout: 60,
    twoFactor: false,
    // Appearance
    theme: 'dark',
    compactMode: false,
    showAnimations: true,
  });
  const [settingsTab, setSettingsTab] = useState('profile');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const updateSetting = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current)           { setPasswordMsg('⚠️ Enter your current password.'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('⚠️ New password must be at least 6 characters.'); return; }
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

  // Add branch modal
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm,    setBranchForm]    = useState({ name: '', location: '' });
  const [branchErrors,  setBranchErrors]  = useState({});
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchSuccess, setBranchSuccess] = useState('');
  const [deleteBranchId,setDeleteBranchId]= useState(null);

  const pollRef = useRef(null);

  /* ── Fetch ── */
  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoadingTxns(true);
    try {
      const { data } = await axios.get(`${API}/transactions`);
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      if (!silent) setLoadingTxns(false);
      setLastRefreshed(new Date());
    }
  }, []);

  const fetchBranches = useCallback(async (silent = false) => {
    if (!silent) setLoadingBranches(true);
    try {
      const { data } = await axios.get(`${API}/branches`);
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    } finally {
      if (!silent) setLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchBranches();
  }, [fetchTransactions, fetchBranches]);

  useEffect(() => {
    if (!ADMIN_ALLOWED_PATHS.has(activePath)) {
      setActivePath(ADMIN_DEFAULT_PATH);
      return;
    }

    localStorage.setItem(adminPathStorageKey, activePath);
  }, [activePath, adminPathStorageKey]);

  // Live polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchTransactions(true);
      fetchBranches(true);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchTransactions, fetchBranches]);

  /* ── Navigation ── */
  const handleNavigate = (path) => {
    setActivePath(path);
    setMobileSidebarOpen(false);
  };

  const getBreadcrumbs = () => ({
    '/admin':              ['Admin', 'Dashboard'],
    '/admin/branches':     ['Admin', 'Branches'],
    '/admin/transactions': ['Admin', 'Transactions'],
    '/admin/users':        ['Admin', 'Users'],
    '/admin/portals':      ['Admin', 'Portal Management'],
    '/admin/notices':      ['Admin', 'Notices'],
    '/admin/expenses':     ['Admin', 'Expenses'],
    '/admin/enquiries':    ['Admin', 'Web Enquiries'],
    '/admin/analytics':    ['Admin', 'Analytics'],
    '/admin/settings':     ['Admin', 'Settings'],
  }[activePath] || ['Admin']);

  /* ── Metrics ── */
  const metrics = React.useMemo(() => ({
    totalAmount:  transactions.reduce((s, t) => s + Number(t.amount  || 0), 0),
    totalCharges: transactions.reduce((s, t) => s + Number(t.charges || 0), 0),
    totalPortal:  transactions.reduce((s, t) => s + Number(t.portal_charges || 0), 0),
    netProfit:    transactions.reduce((s, t) => s + Number(t.profit  || 0), 0),
    count:        transactions.length,
  }), [transactions]);

  const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  /* ── Branch CRUD ── */
  const validateBranch = () => {
    const errs = {};
    if (!branchForm.name.trim())     errs.name     = 'Branch name is required';
    if (!branchForm.location.trim()) errs.location = 'Location is required';
    return errs;
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    const errs = validateBranch();
    if (Object.keys(errs).length) { setBranchErrors(errs); return; }
    
    setBranchLoading(true);
    setBranchErrors({});
    
    try {
      const { data } = await axios.post(`${API}/branches`, branchForm);
      setBranches(prev => [data, ...prev]);
      setBranchSuccess('Branch created successfully!');
      setBranchForm({ name: '', location: '' });
      setTimeout(() => { 
        setBranchSuccess(''); 
        setShowAddBranch(false); 
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create branch';
      setBranchErrors({ name: errorMsg });
    } finally {
      setBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    try { 
      await axios.delete(`${API}/branches/${id}`);
      setBranches(prev => prev.filter(b => b.id !== id));
      setDeleteBranchId(null);
      fetchTransactions(true);
    } catch (err) {
      console.error("Delete branch failed:", err);
      alert("Failed to delete branch. Please try again.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    try { 
      await axios.delete(`${API}/transactions/${id}`); 
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete transaction failed:", err);
    }
  };

  /* ── Sub-renders ── */
  const StatsRow = () => (
    <div className="stats-grid">
      <StatsCard icon="💰" label="Total Volume"       value={fmtINR(metrics.totalAmount)}  trend={8.4}  color="purple" subText={`${metrics.count} transactions`} />
      <StatsCard icon="📈" label="Charges (2.5%)"     value={fmtINR(metrics.totalCharges)} trend={8.4}  color="olive" />
      <StatsCard icon="📉" label="Portal Fees (1.8%)" value={fmtINR(metrics.totalPortal)}  trend={-2.1} color="red" />
      <StatsCard icon="✅" label="Net Profit (0.7%)"  value={fmtINR(metrics.netProfit)}    trend={12.3} color="green" subText={`${branches.length} branches`} />
    </div>
  );

  const BranchGrid = ({ max }) => {
    if (loadingBranches) {
      return (
        <div className="branches-grid" style={{ marginBottom: 28 }}>
          {[1,2,3].map(i => <div key={i} className="branch-card"><div className="skeleton" style={{ height: 130, borderRadius: 10 }} /></div>)}
        </div>
      );
    }
    if (!branches.length) {
      return (
        <div className="panel" style={{ marginBottom: 28 }}>
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-title">No branches found</div>
            <div className="empty-desc">Create your first branch to start tracking data.</div>
          </div>
        </div>
      );
    }
    const displayedBranches = max ? branches.slice(0, max) : branches;
    return (
      <div className="branches-grid" style={{ marginBottom: 28 }}>
        {displayedBranches.map(branch => {
          return (
            <div className="branch-card" key={branch.id}>
              <div className="branch-card-header">
                <div className="branch-avatar">{(branch.name || 'B').charAt(0).toUpperCase()}</div>
                <button className="btn btn-danger btn-icon btn-xs" onClick={() => setDeleteBranchId(branch.id)} title="Delete">🗑</button>
              </div>
              <div className="branch-name">{branch.name}</div>
              <div className="branch-location"><span>📍</span> {branch.location}</div>
              <div className="branch-stats">
                <div className="branch-stat-item">
                  <div className="branch-stat-val">{branch.transaction_count || 0}</div>
                  <div className="branch-stat-key">Transactions</div>
                </div>
                <div className="branch-stat-item">
                  <div className="branch-stat-val" style={{ color: 'var(--green)', fontSize: '0.82rem' }}>
                    ₹{Number(branch.total_profit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="branch-stat-key">Profit</div>
                </div>
              </div>
              <div className="branch-card-footer">
                <span className="badge badge-green">🟢 Active</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                  {branch.created_at ? new Date(branch.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Settings Page ── */
  const SettingsPage = () => {
    const tabs = [
      { id: 'profile',       icon: '👤', label: 'Profile' },
      { id: 'system',        icon: '⚙️', label: 'System' },
      { id: 'charges',       icon: '💰', label: 'Charges' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' },
      { id: 'security',      icon: '🔒', label: 'Security' },
      { id: 'appearance',    icon: '🎨', label: 'Appearance' },
    ];
    return (
      <>
        <div className="page-header">
          <span className="page-tag">Configuration</span>
          <h1 className="page-title">Admin <span>Settings</span></h1>
          <p className="page-desc">Manage your account, system preferences, and security options.</p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 6 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9,
                border: 'none', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, transition: 'all .2s',
                background: settingsTab === tab.id ? 'var(--purple, #7c3aed)' : 'transparent',
                color: settingsTab === tab.id ? '#fff' : 'var(--text-2)',
              }}
            >
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {settingsTab === 'profile' && (
          <>
            <SectionCard title="Admin Profile" desc="Update your personal information and contact details.">
              <FieldRow label="Full Name" hint="Displayed in dashboard and reports">
                <Input value={settings.adminName} onChange={v => updateSetting('adminName', v)} placeholder="Your full name" />
              </FieldRow>
              <FieldRow label="Email Address" hint="Used for system notifications">
                <Input value={settings.adminEmail} onChange={v => updateSetting('adminEmail', v)} type="email" placeholder="admin@company.in" />
              </FieldRow>
              <FieldRow label="Phone Number" hint="Optional — for 2FA and alerts">
                <Input value={settings.adminPhone} onChange={v => updateSetting('adminPhone', v)} placeholder="+91 9876543210" />
              </FieldRow>
            </SectionCard>

            <SectionCard title="Change Password" desc="Use a strong password with letters, numbers, and symbols.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Current Password', key: 'current' },
                  { label: 'New Password',     key: 'newPass' },
                  { label: 'Confirm Password', key: 'confirm' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 5 }}>{f.label}</div>
                    <input
                      type="password"
                      value={passwordForm[f.key]}
                      onChange={e => {
                        const val = e.target.value;
                        setPasswordForm(p => ({ ...p, [f.key]: val }));
                      }}
                      placeholder="••••••••"
                      autoComplete={f.key === 'current' ? 'current-password' : 'new-password'}
                      style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                ))}
                {passwordMsg && (
                  <div style={{ fontSize: '0.82rem', color: passwordMsg.startsWith('✅') ? 'var(--green)' : passwordMsg.startsWith('⚠️') ? 'var(--amber,#b06a00)' : 'var(--red)', fontWeight: 600 }}>{passwordMsg}</div>
                )}
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? '⏳ Updating…' : '🔑 Update Password'}
                </button>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── System Tab ── */}
        {settingsTab === 'system' && (
          <SectionCard title="System Preferences" desc="Configure how the dashboard behaves globally.">
            <FieldRow label="Live Refresh Interval" hint="How often data auto-refreshes (seconds)">
              <Select value={settings.pollInterval} onChange={v => updateSetting('pollInterval', Number(v))}
                options={[{ value: 15, label: '15 seconds' }, { value: 30, label: '30 seconds' }, { value: 60, label: '1 minute' }, { value: 300, label: '5 minutes' }]} />
            </FieldRow>
            <FieldRow label="Currency" hint="Applies to all financial displays">
              <Select value={settings.currency} onChange={v => updateSetting('currency', v)}
                options={[{ value: 'INR', label: '₹ Indian Rupee (INR)' }, { value: 'USD', label: '$ US Dollar (USD)' }, { value: 'EUR', label: '€ Euro (EUR)' }]} />
            </FieldRow>
            <FieldRow label="Date Format" hint="Applies to all date displays">
              <Select value={settings.dateFormat} onChange={v => updateSetting('dateFormat', v)}
                options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
            </FieldRow>
            <FieldRow label="Timezone" hint="Used for timestamps and reports">
              <Select value={settings.timezone} onChange={v => updateSetting('timezone', v)}
                options={[{ value: 'Asia/Kolkata', label: 'IST — Asia/Kolkata' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'EST — New York' }]} />
            </FieldRow>
          </SectionCard>
        )}

        {/* ── Charges Tab ── */}
        {settingsTab === 'charges' && (
          <>
            <SectionCard title="Transaction Fee Rates" desc="Rates used to compute charges and portal fees on each transaction.">
              <FieldRow label="Service Charge Rate (%)" hint="Applied as percentage of each transaction amount">
                <input type="number" min={0} max={100} step={0.1} value={settings.chargeRate}
                  onChange={e => updateSetting('chargeRate', parseFloat(e.target.value))}
                  style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: 120 }} />
              </FieldRow>
              <FieldRow label="Portal Fee Rate (%)" hint="Portal/gateway deduction per transaction">
                <input type="number" min={0} max={100} step={0.1} value={settings.portalRate}
                  onChange={e => updateSetting('portalRate', parseFloat(e.target.value))}
                  style={{ background: 'var(--input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-1)', fontSize: '0.85rem', width: 120 }} />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Rate Preview" desc="How these rates affect a sample ₹10,000 transaction.">
              {[
                { label: 'Transaction Amount', value: '₹10,000' },
                { label: `Service Charges (${settings.chargeRate}%)`, value: `₹${(10000 * settings.chargeRate / 100).toFixed(2)}` },
                { label: `Portal Fees (${settings.portalRate}%)`, value: `₹${(10000 * settings.portalRate / 100).toFixed(2)}` },
                { label: `Net Profit (${(settings.chargeRate - settings.portalRate).toFixed(2)}%)`, value: `₹${(10000 * (settings.chargeRate - settings.portalRate) / 100).toFixed(2)}`, green: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.green ? 'var(--green)' : 'var(--text-1)' }}>{row.value}</span>
                </div>
              ))}
            </SectionCard>
          </>
        )}

        {/* ── Notifications Tab ── */}
        {settingsTab === 'notifications' && (
          <SectionCard title="Notification Preferences" desc="Choose which events trigger alerts for the admin.">
            {[
              { key: 'notifyNewTxn',     label: 'New Transaction Added',   hint: 'Alert on every new transaction entry' },
              { key: 'notifyBranchAdded',label: 'Branch Created/Deleted',  hint: 'Alert when branches are modified' },
              { key: 'notifyLowProfit',  label: 'Low Profit Warning',      hint: 'Alert when profit dips below threshold' },
              { key: 'emailNotify',      label: 'Email Notifications',     hint: 'Send alerts to admin email address' },
            ].map(item => (
              <FieldRow key={item.key} label={item.label} hint={item.hint}>
                <Toggle checked={settings[item.key]} onChange={v => updateSetting(item.key, v)} />
              </FieldRow>
            ))}
          </SectionCard>
        )}

        {/* ── Security Tab ── */}
        {settingsTab === 'security' && (
          <>
            <SectionCard title="Session & Access" desc="Control session timeouts and admin authentication.">
              <FieldRow label="Session Timeout" hint="Auto-logout after inactivity">
                <Select value={settings.sessionTimeout} onChange={v => updateSetting('sessionTimeout', Number(v))}
                  options={[{ value: 15, label: '15 minutes' }, { value: 30, label: '30 minutes' }, { value: 60, label: '1 hour' }, { value: 240, label: '4 hours' }]} />
              </FieldRow>
              <FieldRow label="Two-Factor Authentication" hint="Require OTP on every login (recommended)">
                <Toggle checked={settings.twoFactor} onChange={v => updateSetting('twoFactor', v)} />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Danger Zone" desc="Destructive actions — proceed with caution.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>📤 Export All Data</button>
                <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>🗂 Clear Audit Logs</button>
                <button className="btn btn-danger btn-sm" onClick={onLogout}>🚪 Force Logout All Sessions</button>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Appearance Tab ── */}
        {settingsTab === 'appearance' && (
          <SectionCard title="Interface Appearance" desc="Customize the look and feel of your admin panel.">
            <FieldRow label="Theme" hint="Switch between dark and light mode">
              <Select value={settings.theme} onChange={v => updateSetting('theme', v)}
                options={[{ value: 'dark', label: '🌙 Dark Mode' }, { value: 'light', label: '☀️ Light Mode' }, { value: 'system', label: '💻 Follow System' }]} />
            </FieldRow>
            <FieldRow label="Compact Mode" hint="Reduce spacing for more data on screen">
              <Toggle checked={settings.compactMode} onChange={v => updateSetting('compactMode', v)} />
            </FieldRow>
            <FieldRow label="Animations" hint="Enable smooth transitions and micro-interactions">
              <Toggle checked={settings.showAnimations} onChange={v => updateSetting('showAnimations', v)} />
            </FieldRow>
          </SectionCard>
        )}

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          {settingsSaved && (
            <span style={{ fontSize: '0.83rem', color: 'var(--green)', fontWeight: 600 }}>✅ Settings saved successfully!</span>
          )}
          <button className="btn btn-ghost btn-sm">Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>💾 Save Changes</button>
        </div>
      </>
    );
  };

  /* ── Page Switcher ── */
  const renderPage = () => {
    if (activePath === '/admin/settings') {
      return SettingsPage();
    }

    if (activePath === '/admin/users') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Management</span>
            <h1 className="page-title">User <span>Management</span></h1>
            <p className="page-desc">Add users, assign roles and branch access permissions.</p>
          </div>
          <UsersPage branches={branches} onBranchesUpdate={setBranches} />
        </>
      );
    }

    // ── NEW: Portal Management ──────────────────────────────────────────────
    if (activePath === '/admin/portals') {
      return <PortalPage />;
    }
    // ───────────────────────────────────────────────────────────────────────

    if (activePath === '/admin/notices') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Communication</span>
            <h1 className="page-title">Notice <span>Board</span></h1>
            <p className="page-desc">Create, update, and manage notices shared across the system.</p>
          </div>
          <Noticespage isAdmin />
        </>
      );
    }

    if (activePath === '/admin/expenses') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Finance</span>
            <h1 className="page-title">Branch <span>Expenses</span></h1>
            <p className="page-desc">View, filter and export expense records across all branches.</p>
          </div>
          <AdminExpensesPage branches={branches} />
        </>
      );
    }

    if (activePath === '/admin/enquiries') {
      return <AdminEnquiriesPage />;
    }

    if (activePath === '/admin/branches') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Network</span>
            <h1 className="page-title">Branch <span>Network</span></h1>
            <p className="page-desc">Manage your franchise branches and monitor their performance.</p>
          </div>
          <div className="section-header">
            <div>
              <div className="section-title">All Branches</div>
              <div className="section-subtitle">{branches.length} branches registered</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddBranch(true)}>➕ Add Branch</button>
          </div>
          <BranchGrid />
        </>
      );
    }

    if (activePath === '/admin/transactions') {
      return (
        <>
          <div className="page-header">
            <span className="page-tag">Finance</span>
            <h1 className="page-title">All <span>Transactions</span></h1>
            <p className="page-desc">
              Filter, search and export transactions across all branches.
              {lastRefreshed && <span style={{ marginLeft: 8, fontSize: '0.73rem', color: 'var(--green)' }}>● Live · {lastRefreshed.toLocaleTimeString('en-IN')}</span>}
            </p>
          </div>
          <StatsRow />
          <div className="section-header">
            <div>
              <div className="section-title">Transaction Ledger</div>
              <div className="section-subtitle">{transactions.length} records</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <DownloadReportButton />
              <button className="btn btn-ghost btn-sm" onClick={() => fetchTransactions()}>🔄 Refresh</button>
            </div>
          </div>
          <TransactionTable transactions={transactions} branches={branches} showBranchColumn loading={loadingTxns} onDelete={handleDeleteTransaction} />
        </>
      );
    }

    // Default: Main dashboard
    return (
      <>
        <div className="page-header">
          <span className="page-tag">Admin Panel</span>
          <h1 className="page-title">Operations <span>Dashboard</span></h1>
          <p className="page-desc">
            Complete overview of all branches, transactions and financial metrics.
            {lastRefreshed && <span style={{ marginLeft: 8, fontSize: '0.73rem', color: 'var(--green)' }}>● Live · {lastRefreshed.toLocaleTimeString('en-IN')}</span>}
          </p>
        </div>

        <StatsRow />

        <div className="section-header">
          <div>
            <div className="section-title">Branch Network</div>
            <div className="section-subtitle">{branches.length} active branch{branches.length !== 1 ? 'es' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => handleNavigate('/admin/branches')}>📋 View All</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddBranch(true)}>➕ Add Branch</button>
          </div>
        </div>
        <BranchGrid max={5} />

        <div className="section-header">
          <div>
            <div className="section-title">All Transactions</div>
            <div className="section-subtitle">Filter by date or branch · Export to Excel</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <DownloadReportButton />
            <button className="btn btn-ghost btn-sm" onClick={() => fetchTransactions()}>🔄 Refresh</button>
          </div>
        </div>
        <TransactionTable transactions={transactions} branches={branches} showBranchColumn loading={loadingTxns} onDelete={handleDeleteTransaction} />
      </>
    );
  };

  /* ── Render ── */
  return (
    <div className="app-shell">
      {mobileSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 150, backdropFilter: 'blur(3px)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileSidebarOpen ? ' mobile-open' : ''}`} aria-label="Sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">₹</div>
          <span className="brand-text">Cash<em>flow</em></span>
        </div>
        <nav className="sidebar-nav">
          {[
            { section: 'Overview', items: [
              { icon: '📊', label: 'Dashboard',    path: '/admin' },
              { icon: '🏢', label: 'Branches',     path: '/admin/branches' },
              { icon: '💳', label: 'Transactions', path: '/admin/transactions', badge: 'Live' },
            ]},
            { section: 'Management', items: [
              { icon: '👥', label: 'Users',        path: '/admin/users' },
              { icon: '🌐', label: 'Portal',       path: '/admin/portals' },  // ← NEW
              { icon: '📢', label: 'Notices',       path: '/admin/notices' },
              { icon: '💸', label: 'Expenses',      path: '/admin/expenses' },
              { icon: '📬', label: 'Enquiries',     path: '/admin/enquiries' },
              { icon: '⚙️', label: 'Settings',     path: '/admin/settings' },
            ]},
          ].map(group => (
            <div key={group.section} style={{ marginBottom: 8 }}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.path}
                  className={`nav-item${activePath === item.path ? ' active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleNavigate(item.path)}
                >
                  <div className="nav-icon">{item.icon}</div>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
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
            <div className="user-avatar">{(user?.name || 'A').slice(0,2).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Admin'}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={`main-area${collapsed ? ' sidebar-collapsed' : ''}`}>
        <DashboardNavbar
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) setMobileSidebarOpen(o => !o);
            else setCollapsed(c => !c);
          }}
          breadcrumbs={getBreadcrumbs()}
          userName={user?.name || 'Admin'}
          role="admin"
          notificationCount={0}
          onLogout={onLogout}
          onNavigate={handleNavigate}
        />
        <main className="page-content">{renderPage()}</main>
      </div>

      {showAddBranch && (
        <div className="modal-overlay" onClick={() => setShowAddBranch(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🏢 Add New Branch</h2>
              <button className="modal-close" onClick={() => setShowAddBranch(false)}>✕</button>
            </div>
            <div className="modal-body">
              {branchSuccess && <div className="alert alert-success" style={{ marginBottom: 14 }}>{branchSuccess}</div>}
              <form onSubmit={handleAddBranch} noValidate>
                {[
                  { id: 'b-name', label: 'Branch Name', key: 'name', ph: 'e.g. Branch Sangamner' },
                  { id: 'b-loc',  label: 'Location',    key: 'location', ph: 'e.g. Sangamner, Maharashtra' },
                ].map(f => (
                  <div className="form-group" key={f.key}>
                    <label className="form-label" htmlFor={f.id}>{f.label} <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      id={f.id} type="text"
                      className={`form-control${branchErrors[f.key] ? ' error' : ''}`}
                      value={branchForm[f.key]}
                      onChange={e => { setBranchForm(p => ({ ...p, [f.key]: e.target.value })); setBranchErrors(p => ({ ...p, [f.key]: '' })); }}
                      placeholder={f.ph} style={{ padding: '10px 14px' }}
                    />
                    {branchErrors[f.key] && <span className="form-error">{branchErrors[f.key]}</span>}
                  </div>
                ))}
                <div className="modal-footer" style={{ padding: 0, paddingTop: 14 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddBranch(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={branchLoading}>
                    {branchLoading ? 'Creating…' : '➕ Create Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteBranchId && (
        <div className="modal-overlay" onClick={() => setDeleteBranchId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Delete Branch</h2>
              <button className="modal-close" onClick={() => setDeleteBranchId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                Deleting this branch will also remove all associated transactions. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteBranchId(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBranch(deleteBranchId)}>🗑 Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

