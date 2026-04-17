import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/dashboard.css';
import '../styles/form.css';
import '../styles/users.css';

const API = 'http://localhost:5000/api';

/**
 * Login Page
 *
 * Props:
 *   onLogin(role, userData) — called on successful login
 *                             App.jsx / LoginWrapper handles navigation
 */
const Login = ({ onLogin }) => {
  const [role,      setRole]      = useState('admin');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [branchId,  setBranchId]  = useState('');
  const [branches,  setBranches]  = useState([]);
  const [loadingBr, setLoadingBr] = useState(false);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [apiErr,    setApiErr]    = useState('');
  const [showPass,  setShowPass]  = useState(false);

  /* ── Fetch branches when branch role selected ── */
  useEffect(() => {
    if (role !== 'branch') return;
    setLoadingBr(true);
    axios.get(`${API}/branches`)
      .then(({ data }) => setBranches(data))
      .catch(() => setBranches(MOCK_BRANCHES))
      .finally(() => setLoadingBr(false));
  }, [role]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!username.trim())
      errs.username = 'Username is required';
    if (!password || password.length < 4)
      errs.password = 'Password must be at least 4 characters';
    if (role === 'branch' && !branchId)
      errs.branchId = 'Select your branch';
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiErr('');

    try {
    //    ── Real API (uncomment when backend is ready) ──
      const { data } = await axios.post(`${API}/auth/login`, {
        username, password, role, branch_id: branchId || undefined,
      });
      onLogin(data.user.role, data.user);
      return;
    //   ── End real API ── 

//       // ── Demo mode (no backend needed) ──
//       await new Promise(r => setTimeout(r, 800));

//       const DEMO = {
//         admin:  { user: 'admin',   pass: 'admin123' },
//         branch: { user: 'branch1', pass: 'branch123' },
//       };

//       const cred = DEMO[role];

//       if (username.trim() === cred.user && password === cred.pass) {
//         const selectedBranch = branchId
//           ? branches.find(b => String(b.id) === String(branchId))
//           : null;

//         // Pass user data up → LoginWrapper will navigate
//         onLogin(role, {
//           name:   role === 'admin'
//             ? 'Admin User'
//             : `Manager - ${selectedBranch?.name ?? 'Branch'}`,
//           role,
//           branch: selectedBranch ?? null,
//         });

//       } else {
//         setApiErr(
//           `Invalid credentials. Use "${cred.user}" / "${DEMO[role].pass}" for demo.`
//         );
//       }

    } catch (err) {
      setApiErr(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (r) => {
    setRole(r);
    setErrors({});
    setApiErr('');
    setBranchId('');
  };

  /* ── Styles (inline keeps this file self-contained) ── */
  const card = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    width: '100%',
    maxWidth: 460,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    animation: 'slideUp 0.35s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle,rgba(219,212,255,.48) 0%,transparent 70%)', top:-100, right:-80, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(128,128,52,.1) 0%,transparent 70%)', bottom:-80, left:-60, pointerEvents:'none' }} />

      <div style={card}>
        {/* Accent bar */}
        <div style={{ height:4, background:'linear-gradient(90deg,var(--primary-dark),var(--primary),var(--soft-purple))' }} />

        {/* Header */}
        <div style={{ padding:'30px 32px 22px', textAlign:'center' }}>
          <div style={{
            width:54, height:54, borderRadius:16,
            background:'linear-gradient(135deg,var(--primary-dark),var(--primary-lite))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.5rem', color:'#fff', margin:'0 auto 14px',
            boxShadow:'0 8px 24px rgba(114,52,128,.35)',
          }}>₹</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.55rem', fontWeight:800, color:'var(--text-1)', marginBottom:4 }}>
            Cash<em style={{ color:'var(--primary)' }}>flow</em> ERP
          </h1>
          <p style={{ fontSize:'0.82rem', color:'var(--text-3)' }}>Fintech Operations Management</p>
        </div>

        <div style={{ padding:'0 32px 32px' }}>
          {/* Role toggle */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
            background:'var(--bg)', padding:5,
            borderRadius:'var(--radius-md)', marginBottom:24,
            border:'1px solid var(--border)',
          }}>
            {[{ value:'admin', label:'👑 Admin' }, { value:'branch', label:'🏢 Branch' }].map(r => (
              <button
                key={r.value} type="button"
                onClick={() => handleRoleChange(r.value)}
                style={{
                  padding:'9px 10px', border:'none', fontWeight:600,
                  fontSize:'0.82rem', cursor:'pointer', transition:'all .25s',
                  borderRadius:'calc(var(--radius-md) - 3px)',
                  background: role === r.value ? 'linear-gradient(135deg,var(--primary),var(--primary-lite))' : 'transparent',
                  color: role === r.value ? '#fff' : 'var(--text-3)',
                  boxShadow: role === r.value ? '0 3px 10px rgba(114,52,128,.3)' : 'none',
                  fontFamily:"'DM Sans',sans-serif",
                }}
              >{r.label}</button>
            ))}
          </div>

          {/* API Error */}
          {apiErr && (
            <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ {apiErr}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="user-form-group">
              <label className="user-form-label" htmlFor="l-user">
                Username <span className="req">*</span>
              </label>
              <div className="user-input-wrap">
                <span className="user-input-ico">👤</span>
                <input
                  id="l-user" type="text" name="username"
                  className={`user-form-input${errors.username ? ' has-err' : ''}`}
                  value={username}
                  onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username:'' })); }}
                  placeholder={role === 'Admin' ? 'branch' : 'enter username or email'}
                  autoComplete="username" autoFocus
                />
              </div>
              {errors.username && <div className="user-form-error">⚠ {errors.username}</div>}
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
                  type={showPass ? 'text' : 'password'} name="password"
                  className={`user-form-input${errors.password ? ' has-err' : ''}`}
                  style={{ paddingRight:40 }}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password:'' })); }}
                  placeholder={role === 'Admin' ? 'branch' : 'enter password'}
                  autoComplete="current-password"
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'var(--text-3)', padding:0, lineHeight:1 }}
                  aria-label="Toggle password"
                >{showPass ? '🙈' : '👁'}</button>
              </div>
              {errors.password && <div className="user-form-error">⚠ {errors.password}</div>}
            </div>

            {/* Branch selector — branch role only */}
            {role === 'branch' && (
              <div className="user-form-group">
                <label className="user-form-label" htmlFor="l-branch">
                  Your Branch <span className="req">*</span>
                </label>
                <div className="user-input-wrap">
                  <span className="user-input-ico">🏢</span>
                  <select
                    id="l-branch" name="branch_id"
                    className={`user-form-select${errors.branchId ? ' has-err' : ''}`}
                    value={branchId}
                    onChange={e => { setBranchId(e.target.value); setErrors(p => ({ ...p, branchId:'' })); }}
                    disabled={loadingBr}
                  >
                    <option value="">{loadingBr ? 'Loading branches…' : '— Select Branch —'}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} · {b.location}</option>
                    ))}
                  </select>
                </div>
                {errors.branchId && <div className="user-form-error">⚠ {errors.branchId}</div>}

                {/* Preview chip */}
                {branchId && (() => {
                  const sel = branches.find(b => String(b.id) === String(branchId));
                  return sel ? (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'linear-gradient(135deg,rgba(219,212,255,.3),rgba(255,255,227,.5))', borderRadius:8, border:'1px solid rgba(114,52,128,.15)', fontSize:'0.77rem', color:'var(--primary)' }}>
                      <strong>📍</strong> {sel.name} · {sel.location}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit" disabled={loading}
              style={{
                width:'100%', padding:'12px 24px', marginTop:6,
                background:'linear-gradient(135deg,var(--primary),var(--primary-lite))',
                color:'#fff', border:'none', borderRadius:50,
                fontSize:'0.92rem', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                transition:'all .25s', fontFamily:"'DM Sans',sans-serif",
                boxShadow:'0 6px 22px rgba(114,52,128,.32)',
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={{ display:'inline-block', width:15, height:15, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                `Sign in as ${role === 'admin' ? 'Admin' : 'Branch'} →`
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          {/* <div style={{
            marginTop:18, padding:'12px 14px',
            background:'var(--bg)', borderRadius:8,
            border:'1px solid var(--border-soft)',
            fontSize:'0.72rem', color:'var(--text-3)', lineHeight:1.7,
          }}>
            <div style={{ fontWeight:700, color:'var(--primary)', marginBottom:4 }}>🔑 Demo Credentials</div>
            <div>Admin &nbsp;→ <code style={{ background:'rgba(114,52,128,.08)', padding:'1px 6px', borderRadius:4 }}>admin</code> / <code style={{ background:'rgba(114,52,128,.08)', padding:'1px 6px', borderRadius:4 }}>admin123</code></div>
            <div>Branch → <code style={{ background:'rgba(114,52,128,.08)', padding:'1px 6px', borderRadius:4 }}>branch1</code> / <code style={{ background:'rgba(114,52,128,.08)', padding:'1px 6px', borderRadius:4 }}>branch123</code></div>
            <div style={{ marginTop:6, color:'var(--olive)', fontWeight:600 }}>
              ℹ️ No backend needed — demo works offline.
            </div>
          </div> */}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to   { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ── Fallback branch list when API is offline ── */
const MOCK_BRANCHES = [
  { id: 1, name: 'Branch Pune',     location: 'Pune, Maharashtra'   },
  { id: 2, name: 'Branch Mumbai',   location: 'Mumbai, Maharashtra' },
  { id: 3, name: 'Branch Nashik',   location: 'Nashik, Maharashtra' },
];

export default Login;


