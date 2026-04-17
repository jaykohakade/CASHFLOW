import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import '../styles/dashboard.css';
import '../styles/users.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLES = ['admin', 'branch'];

const initForm = { name: '', email: '', phone: '', password: '', role: 'branch', branch_id: '' };

const UsersPage = ({ branches = [], onBranchesUpdate }) => {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(initForm);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState('');
  const [apiErr,      setApiErr]      = useState('');
  const [search,      setSearch]      = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [editUser,    setEditUser]    = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [localBranches, setLocalBranches] = useState(branches);

  /* ── Sync branches prop ── */
  useEffect(() => { setLocalBranches(branches); }, [branches]);

  /* ── Fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users`);
      setUsers(data);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch branches if not provided ── */
  const fetchBranches = useCallback(async () => {
    if (localBranches.length) return;
    try {
      const { data } = await axios.get(`${API}/branches`);
      setLocalBranches(data);
      onBranchesUpdate && onBranchesUpdate(data);
    } catch {
      setLocalBranches(MOCK_BRANCHES);
    }
  }, [localBranches.length, onBranchesUpdate]);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  /* ── Metrics ── */
  const metrics = useMemo(() => ({
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin').length,
    branches: users.filter(u => u.role === 'branch').length,
    active:   users.filter(u => u.status !== 'inactive').length,
  }), [users]);

  /* ── Filtered users ── */
  const filtered = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.branch_name?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  /* ── Validation ── */
  const validate = (f) => {
    const errs = {};
    if (!f.name.trim() || f.name.trim().length < 2)
      errs.name = 'Full name is required (min 2 chars)';
    if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      errs.email = 'Valid email address required';
    if (!f.phone.trim() || !/^[6-9]\d{9}$/.test(f.phone))
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!f.password.trim() || f.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (!f.role)
      errs.role = 'Select a role';
    if (f.role === 'branch' && !f.branch_id)
      errs.branch_id = 'Select a branch for this user';
    return errs;
  };

  /* ── Field change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiErr('');
  };

  /* ── Submit add user ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const selectedBranch = localBranches.find(b => String(b.id) === String(form.branch_id));
      const payload = {
        ...form,
        branch_name: selectedBranch?.name || null,
        status: 'active',
      };

      const { data } = await axios.post(`${API}/users`, payload);
      setUsers(prev => [data, ...prev]);
      setSuccess(`✅ User "${form.name}" added successfully! Password stored securely.`);
      setForm(initForm);
      setShowPass(false);
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create user';
      setApiErr(errorMsg);
      console.error('User creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete user ── */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/users/${id}`);
    } catch { /* demo mode */ }
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteId(null);
  };

  /* ── Toggle status ── */
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${API}/users/${user.id}`, { status: newStatus });
    } catch { /* demo */ }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const branchLabel = (user) => {
    if (user.role === 'admin') return null;
    return user.branch_name || `Branch #${user.branch_id}` || '—';
  };

  return (
    <div className="users-page">
      {/* ── Stat cards ── */}
      <div className="users-stats-grid">
        {[
          { icon: '👥', label: 'Total Users',    value: metrics.total,    color: 'purple' },
          { icon: '👑', label: 'Admins',         value: metrics.admins,   color: 'olive'  },
          { icon: '🏢', label: 'Branch Users',   value: metrics.branches, color: 'blue'   },
          { icon: '✅', label: 'Active Users',   value: metrics.active,   color: 'green'  },
        ].map(s => (
          <div className={`stat-card ${s.color}`} key={s.label}>
            <div className="stat-top">
              <div className="stat-icon">{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Split layout ── */}
      <div className="users-layout">

        {/* ── Users Table ── */}
        <div className="users-table-card">
          <div className="users-table-toolbar">
            <div style={{ flex: 1 }}>
              <div className="users-table-title">All Users</div>
              <div className="users-table-sub">{filtered.length} of {users.length} users</div>
            </div>

            {/* Role filters */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['all', 'admin', 'branch'].map(r => (
                <button
                  key={r}
                  className={`role-filter-btn${
                    roleFilter === r
                      ? r === 'admin' ? ' active-admin'
                      : r === 'branch' ? ' active-branch'
                      : ' active-all'
                      : ''
                  }`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'all' ? '🌐 All' : r === 'admin' ? '👑 Admin' : '🏢 Branch'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="users-search">
              <span className="users-search-ico">🔍</span>
              <input
                type="text"
                placeholder="Search name, email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="users-scroll">
            {loading ? (
              <div style={{ padding: 32 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 48, marginBottom: 10, borderRadius: 8 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="users-empty">
                <div className="users-empty-icon">👤</div>
                <div className="users-empty-text">No users match your filters</div>
              </div>
            ) : (
              <table className="users-table" role="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => (
                    <tr key={user.id}>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>{idx + 1}</td>
                      <td>
                        <div className="user-cell">
                          <div className={`user-cell-avatar ${user.role === 'admin' ? 'avatar-admin' : 'avatar-branch'}`}>
                            {initials(user.name)}
                          </div>
                          <div>
                            <div className="user-cell-name">{user.name}</div>
                            <div className="user-cell-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{user.phone || '—'}</td>
                      <td>
                        <span className={`role-badge ${user.role === 'admin' ? 'role-badge-admin' : 'role-badge-branch'}`}>
                          {user.role === 'admin' ? '👑' : '🏢'} {user.role}
                        </span>
                      </td>
                      <td>
                        {branchLabel(user)
                          ? <span className="branch-chip">🏢 {branchLabel(user)}</span>
                          : <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>—</span>
                        }
                      </td>
                      <td>
                        <span
                          className={`status-dot ${user.status === 'active' ? 'active' : 'inactive'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(user)}
                          title="Click to toggle status"
                        >
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                      <td>
                        <div className="user-actions">
                          <button
                            className="btn btn-ghost btn-xs btn-icon"
                            onClick={() => setEditUser(user)}
                            title="Edit user"
                          >✏️</button>
                          <button
                            className="btn btn-danger btn-xs btn-icon"
                            onClick={() => setDeleteId(user.id)}
                            title="Delete user"
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="users-table-footer">
            <div className="users-count">
              Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
            </div>
            <button className="btn btn-ghost btn-xs" onClick={fetchUsers}>🔄 Refresh</button>
          </div>
        </div>

        {/* ── Add User Form ── */}
        <div className="add-user-card">
          <div className="add-user-card-header">
            <div className="add-user-card-icon">👤</div>
            <div>
              <div className="add-user-card-title">Add New User</div>
              <div className="add-user-card-sub">Assign role & branch access</div>
            </div>
          </div>

          <div className="add-user-card-body">
            {success && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                ✅ {success}
              </div>
            )}
            {apiErr && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                ⚠️ {apiErr}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="u-name">
                  Full Name <span className="req">*</span>
                </label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">👤</span>
                  <input
                    id="u-name"
                    type="text"
                    name="name"
                    className={`user-form-input${errors.name ? ' has-err' : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                  />
                </div>
                {errors.name && <div className="user-form-error">⚠ {errors.name}</div>}
              </div>

              {/* Email */}
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="u-email">
                  Email <span className="req">*</span>
                </label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">✉️</span>
                  <input
                    id="u-email"
                    type="email"
                    name="email"
                    className={`user-form-input${errors.email ? ' has-err' : ''}`}
                    value={form.email}
                    onChange={handleChange}
                    placeholder="rahul@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <div className="user-form-error">⚠ {errors.email}</div>}
              </div>

              {/* Phone */}
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="u-phone">
                  Mobile Number <span className="req">*</span>
                </label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">📱</span>
                  <input
                    id="u-phone"
                    type="tel"
                    name="phone"
                    className={`user-form-input${errors.phone ? ' has-err' : ''}`}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                {errors.phone && <div className="user-form-error">⚠ {errors.phone}</div>}
              </div>

               {/* Password */}
            <div className="user-form-group">
              <label className="user-form-label" htmlFor="l-pass">
                Password <span className="req">*</span>
              </label>
              <div className="user-input-wrap" style={{ position:'relative' }}>
                <span className="user-input-ico">🔒</span>
                <input
                  id="l-pass"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  className={`user-form-input${errors.password ? ' has-err' : ''}`}
                  style={{ paddingRight:40 }}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'var(--text-3)', padding:0, lineHeight:1 }}
                  aria-label="Toggle password"
                >{showPass ? '🙈' : '👁'}</button>
              </div>
              {errors.password && <div className="user-form-error">⚠ {errors.password}</div>}
            </div>

              {/* Role */}
              <div className="user-form-group">
                <label className="user-form-label">
                  Role <span className="req">*</span>
                </label>
                <div className="role-tag-row">
                  <button
                    type="button"
                    className={`role-tag${form.role === 'admin' ? ' selected-admin' : ''}`}
                    onClick={() => { setForm(p => ({ ...p, role: 'admin', branch_id: '' })); setErrors(p => ({ ...p, role: '', branch_id: '' })); }}
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    className={`role-tag${form.role === 'branch' ? ' selected-branch' : ''}`}
                    onClick={() => { setForm(p => ({ ...p, role: 'branch' })); setErrors(p => ({ ...p, role: '' })); }}
                  >
                    🏢 Branch
                  </button>
                </div>
                {errors.role && <div className="user-form-error">⚠ {errors.role}</div>}
              </div>

              {/* Branch selector — only for branch role */}
              {form.role === 'branch' && (
                <div className="user-form-group">
                  <label className="user-form-label" htmlFor="u-branch">
                    Assign Branch <span className="req">*</span>
                  </label>
                  <div className="user-input-wrap">
                    <span className="user-input-ico">🏢</span>
                    <select
                      id="u-branch"
                      name="branch_id"
                      className={`user-form-select${errors.branch_id ? ' has-err' : ''}`}
                      value={form.branch_id}
                      onChange={handleChange}
                    >
                      <option value="">— Select Branch —</option>
                      {localBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.branch_id && <div className="user-form-error">⚠ {errors.branch_id}</div>}
                </div>
              )}

              {/* Selected branch preview */}
              {form.role === 'branch' && form.branch_id && (() => {
                const sel = localBranches.find(b => String(b.id) === String(form.branch_id));
                return sel ? (
                  <div style={{
                    padding: '10px 13px',
                    background: 'linear-gradient(135deg, rgba(219,212,255,0.3), rgba(255,255,227,0.5))',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(114,52,128,0.15)',
                    marginBottom: 16,
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                  }}>
                    <strong>📍</strong> {sel.name} · {sel.location}
                  </div>
                ) : null;
              })()}

              {/* Actions */}
              <div className="user-form-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setForm(initForm); setErrors({}); setApiErr(''); }}
                  disabled={saving}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 13, height: 13,
                        border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                      }} />
                      Saving…
                    </>
                  ) : '➕ Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editUser && (
        <EditUserModal
          user={editUser}
          branches={localBranches}
          onClose={() => setEditUser(null)}
          onSave={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setEditUser(null);
          }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Delete User</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                Are you sure you want to delete this user? They will lose all access immediately. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deleteId)}>
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── Edit User Modal ── */
const EditUserModal = ({ user, branches, onClose, onSave }) => {
  const [form,   setForm]   = useState({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, branch_id: user.branch_id || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = (f) => {
    const errs = {};
    if (!f.name.trim()) errs.name = 'Name is required';
    if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Valid email required';
    if (!f.phone || !/^[6-9]\d{9}$/.test(f.phone)) errs.phone = 'Valid 10-digit number required';
    if (f.role === 'branch' && !f.branch_id) errs.branch_id = 'Select a branch';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/users/${user.id}`, form);
    } catch { /* demo */ }
    const selBranch = branches.find(b => String(b.id) === String(form.branch_id));
    onSave({ ...user, ...form, branch_name: selBranch?.name || null });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">✏️ Edit User</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { id: 'e-name', label: 'Full Name', name: 'name', type: 'text', icon: '👤', placeholder: 'Full name' },
              { id: 'e-email', label: 'Email', name: 'email', type: 'email', icon: '✉️', placeholder: 'email@example.com' },
              { id: 'e-phone', label: 'Phone', name: 'phone', type: 'tel', icon: '📱', placeholder: '9876543210', maxLength: 10 },
            ].map(f => (
              <div className="user-form-group" key={f.id} style={{ marginBottom: 0 }}>
                <label className="user-form-label" htmlFor={f.id}>{f.label}</label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">{f.icon}</span>
                  <input
                    id={f.id}
                    type={f.type}
                    name={f.name}
                    className={`user-form-input${errors[f.name] ? ' has-err' : ''}`}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                  />
                </div>
                {errors[f.name] && <div className="user-form-error">⚠ {errors[f.name]}</div>}
              </div>
            ))}

            <div className="user-form-group" style={{ marginBottom: 0 }}>
              <label className="user-form-label">Role</label>
              <div className="role-tag-row">
                {['admin', 'branch'].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`role-tag${form.role === r ? (r === 'admin' ? ' selected-admin' : ' selected-branch') : ''}`}
                    onClick={() => setForm(p => ({ ...p, role: r, branch_id: r === 'admin' ? '' : p.branch_id }))}
                  >
                    {r === 'admin' ? '👑 Admin' : '🏢 Branch'}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'branch' && (
              <div className="user-form-group" style={{ marginBottom: 0 }}>
                <label className="user-form-label" htmlFor="e-branch">Branch</label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">🏢</span>
                  <select
                    id="e-branch"
                    name="branch_id"
                    className={`user-form-select${errors.branch_id ? ' has-err' : ''}`}
                    value={form.branch_id}
                    onChange={handleChange}
                  >
                    <option value="">— Select Branch —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {errors.branch_id && <div className="user-form-error">⚠ {errors.branch_id}</div>}
              </div>
            )}

            <div className="modal-footer" style={{ padding: 0, paddingTop: 16 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Mock data ── */
const MOCK_BRANCHES = [
  { id: 1, name: 'Branch Pune',   location: 'Pune, Maharashtra' },
  { id: 2, name: 'Branch Mumbai', location: 'Mumbai, Maharashtra' },
  { id: 3, name: 'Branch Nashik', location: 'Nashik, Maharashtra' },
];

const MOCK_USERS = [
  { id: 1, name: 'Super Admin',    email: 'admin@cashflow.in',    phone: '9876543210', role: 'admin',  branch_id: null, branch_name: null,           status: 'active',   created_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Priya Deshmukh', email: 'priya@cashflow.in',   phone: '9812345678', role: 'branch', branch_id: 1,    branch_name: 'Branch Pune',   status: 'active',   created_at: '2024-02-10T00:00:00Z' },
  { id: 3, name: 'Ravi Kulkarni',  email: 'ravi@cashflow.in',    phone: '9876501234', role: 'branch', branch_id: 2,    branch_name: 'Branch Mumbai', status: 'active',   created_at: '2024-03-05T00:00:00Z' },
  { id: 4, name: 'Anjali Patil',   email: 'anjali@cashflow.in',  phone: '9870012345', role: 'branch', branch_id: 3,    branch_name: 'Branch Nashik', status: 'inactive', created_at: '2024-03-20T00:00:00Z' },
];

export default UsersPage;