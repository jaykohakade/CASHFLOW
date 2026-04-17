import React, { useState, useEffect, useRef } from 'react';
import '../../styles/dashboard.css';

/* ─────────────────────────────────────────────────────
   DashboardNavbar — fully functional
   Props:
     collapsed        boolean
     onToggleSidebar  () => void
     breadcrumbs      string[]
     userName         string
     role             'admin' | 'branch'
     notificationCount number
     notifications    array | null   (real data from parent)
     onLogout         () => void
     onNavigate       (path: string) => void   (optional, for search clicks)
     searchable       string[]       (nav items to search through)
────────────────────────────────────────────────────── */

const DashboardNavbar = ({
  collapsed,
  onToggleSidebar,
  breadcrumbs = [],
  userName = 'Admin',
  role = 'admin',
  notificationCount = 0,
  notifications: notifProp = null,
  onLogout,
  onNavigate,
  navItems = [],
}) => {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  /* ── Clock ─────────────────────────────────────────── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

  /* ── Notifications ──────────────────────────────────── */
  const [notifs, setNotifs] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(notifProp) && notifProp.length > 0) {
      setNotifs(notifProp.map((n, i) => ({ ...n, _key: n.id || i })));
    }
  }, [notifProp]);

  const unreadCount = notifs.filter(n => n.unread).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  const markOneRead = (key) => setNotifs(prev => prev.map(n => n._key === key ? { ...n, unread: false } : n));
  const clearAll = () => setNotifs([]);

  /* ── Search ─────────────────────────────────────────── */
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Default nav items per role if none passed
  const defaultAdminItems = [
    { icon: '📊', label: 'Dashboard',    path: '/admin' },
    { icon: '🏢', label: 'Branches',     path: '/admin/branches' },
    { icon: '💳', label: 'Transactions', path: '/admin/transactions' },
    { icon: '👥', label: 'Users',        path: '/admin/users' },
    { icon: '🌐', label: 'Portal',       path: '/admin/portals' },
    { icon: '📢', label: 'Notices',      path: '/admin/notices' },
    { icon: '💸', label: 'Expenses',     path: '/admin/expenses' },
    { icon: '⚙️', label: 'Settings',    path: '/admin/settings' },
  ];
  const defaultBranchItems = [
    { icon: '🏠', label: 'My Dashboard',    path: '/branch' },
    { icon: '➕', label: 'Add Transaction',  path: '/branch/add' },
    { icon: '📋', label: 'My Transactions',  path: '/branch/transactions' },
    { icon: '📢', label: 'Notices',          path: '/branch/notices' },
    { icon: '💸', label: 'Expenses',         path: '/branch/expenses' },
    { icon: '📊', label: 'My Reports',       path: '/branch/reports' },
    { icon: '⚙️', label: 'Settings',        path: '/branch/settings' },
  ];
  const allItems = navItems.length > 0 ? navItems : (role === 'admin' ? defaultAdminItems : defaultBranchItems);

  const suggestions = query.trim().length > 0
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };
  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  const handleSuggestionClick = (path) => {
    onNavigate && onNavigate(path);
    closeSearch();
  };

  /* ── Profile dropdown ───────────────────────────────── */
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  /* ── Outside click handler ──────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch();
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Keyboard shortcuts ─────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearch(); setShowNotif(false); setShowProfile(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ── Styles (inline for self-containment) ───────────── */
  const dropBase = {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    background: 'var(--surface, #fff)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: '0 16px 48px rgba(114,52,128,0.16)',
    zIndex: 400,
    overflow: 'hidden',
    animation: 'navbarDropIn 0.18s ease',
  };

  return (
    <>
      <style>{`
        @keyframes navbarDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-search-overlay {
          position: fixed; inset: 0; background: rgba(28,28,46,0.45);
          backdrop-filter: blur(4px); z-index: 500;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 80px;
          animation: navbarDropIn 0.15s ease;
        }
        .nb-search-box {
          width: 100%; max-width: 560px; background: var(--surface, #fff);
          border: 1px solid var(--border); border-radius: 18px;
          box-shadow: 0 24px 64px rgba(114,52,128,0.22); overflow: hidden;
          margin: 0 16px;
        }
        .nb-search-input {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; border-bottom: 1px solid var(--border, #eee);
        }
        .nb-search-input input {
          flex: 1; border: none; outline: none; font-size: 1rem;
          background: transparent; color: var(--text-1, #1c1c2e);
        }
        .nb-suggest-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; cursor: pointer; transition: background 0.12s;
          font-size: 0.88rem; color: var(--text-1, #1c1c2e);
        }
        .nb-suggest-item:hover { background: var(--surface-2, rgba(114,52,128,0.05)); }
        .nb-suggest-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(114,52,128,0.08); display: flex;
          align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;
        }
        .nb-notif-item {
          display: flex; gap: 10px; padding: 12px 16px;
          border-bottom: 1px solid var(--border-soft, rgba(114,52,128,0.07));
          cursor: pointer; transition: background 0.13s;
        }
        .nb-notif-item:hover { background: rgba(114,52,128,0.04); }
        .nb-notif-item.unread { background: rgba(219,212,255,0.15); }
        .nb-profile-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; cursor: pointer; font-size: 0.85rem;
          color: var(--text-1, #1c1c2e); transition: background 0.12s;
          border-radius: 0;
        }
        .nb-profile-item:hover { background: rgba(114,52,128,0.05); }
        .nb-profile-item.danger { color: var(--red, #c0392b); }
        .nb-profile-item.danger:hover { background: rgba(192,57,43,0.06); }
        /* Dark mode awareness */
        [data-theme="dark"] .nb-search-box,
        [data-theme="dark"] .nb-search-input input { color: #fff !important; }
        [data-theme="dark"] .nb-suggest-item,
        [data-theme="dark"] .nb-profile-item { color: #fff !important; }
      `}</style>

      <header className={`top-navbar${collapsed ? ' sidebar-collapsed' : ''}`} role="banner">

        {/* ── Hamburger ── */}
        <button className="navbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span className="toggle-bar" />
          <span className="toggle-bar" style={{ width: 14 }} />
          <span className="toggle-bar" />
        </button>

        {/* ── Breadcrumb ── */}
        <nav className="navbar-breadcrumb" aria-label="Breadcrumb">
          <span style={{ opacity: 0.55 }}>Cashflow ERP</span>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <span className="breadcrumb-sep">›</span>
              <span className={i === breadcrumbs.length - 1 ? 'breadcrumb-current' : ''}>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>

        {/* ── Spacer + Clock ── */}
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          marginRight: 4, lineHeight: 1.3, flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{dateStr}</span>
        </div>

        {/* ── Actions ── */}
        <div className="navbar-actions">

          {/* Role Badge */}
          <span className="badge" style={{
            background: role === 'admin' ? 'rgba(114,52,128,0.1)' : 'rgba(128,128,52,0.1)',
            color: role === 'admin' ? 'var(--primary)' : 'var(--olive)',
            fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px',
          }}>
            {role === 'admin' ? '👑 Admin' : '🏢 Branch'}
          </span>

          {/* ── Search button ── */}
          <button
            className="nav-action-btn"
            onClick={openSearch}
            aria-label="Search (Ctrl+K)"
            title="Search pages (Ctrl+K)"
          >
            🔍
            <span style={{
              position: 'absolute', bottom: -1, right: -1,
              fontSize: '0.48rem', background: 'var(--primary)', color: '#fff',
              borderRadius: 4, padding: '1px 3px', fontWeight: 700, lineHeight: 1.2,
            }}>⌘K</span>
          </button>

          {/* ── Notifications ── */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="nav-action-btn"
              onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--red, #c0392b)', color: '#fff',
                  fontSize: '0.55rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--surface, #fff)',
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotif && (
              <div style={{ ...dropBase, width: 320, maxHeight: 420, overflowY: 'auto' }}>
                {/* Header */}
                <div style={{
                  padding: '13px 16px', borderBottom: '1px solid var(--border-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0,
                  background: 'var(--surface)', zIndex: 1,
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    Notifications {unreadCount > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--primary)', marginLeft: 4 }}>({unreadCount} new)</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {unreadCount > 0 && (
                      <span onClick={markAllRead} style={{ fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                        ✓ Mark all read
                      </span>
                    )}
                    {notifs.length > 0 && (
                      <span onClick={clearAll} style={{ fontSize: '0.72rem', color: 'var(--text-3)', cursor: 'pointer' }}>
                        Clear
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔔</div>
                    <div style={{ fontSize: '0.82rem' }}>No notifications</div>
                  </div>
                ) : notifs.map(n => (
                  <div
                    key={n._key}
                    className={`nb-notif-item${n.unread ? ' unread' : ''}`}
                    onClick={() => markOneRead(n._key)}
                  >
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-1)', lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3 }}>{n.time}</div>
                    </div>
                    {n.unread && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--primary)', alignSelf: 'flex-start',
                        marginTop: 6, flexShrink: 0,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Profile dropdown ── */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <div
              className="navbar-profile"
              role="button"
              tabIndex={0}
              onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
              onKeyDown={e => e.key === 'Enter' && setShowProfile(v => !v)}
              aria-label="Profile menu"
            >
              <div className="profile-avatar">{initials}</div>
              <div style={{ display: window.innerWidth < 600 ? 'none' : undefined }}>
                <div className="profile-name">{userName}</div>
                <div className="profile-role">{role === 'admin' ? 'Administrator' : 'Branch Manager'}</div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginLeft: 2 }}>▾</span>
            </div>

            {showProfile && (
              <div style={{ ...dropBase, width: 220, right: 0 }}>
                {/* User info strip */}
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border-soft)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-lite, #9b45b0))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-1)' }}>{userName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{role === 'admin' ? 'Administrator' : 'Branch Manager'}</div>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  {
                    icon: '⚙️',
                    label: 'Settings',
                    onClick: () => {
                      onNavigate && onNavigate(role === 'admin' ? '/admin/settings' : '/branch/settings');
                      setShowProfile(false);
                    },
                  },
                ].map(item => (
                  <div key={item.label} className="nb-profile-item" onClick={item.onClick}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 4 }} />

                <div
                  className="nb-profile-item danger"
                  onClick={() => { setShowProfile(false); onLogout && onLogout(); }}
                >
                  <span style={{ fontSize: '1rem' }}>🚪</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Global Search Overlay ── */}
      {searchOpen && (
        <div className="nb-search-overlay" onClick={closeSearch} ref={searchRef}>
          <div className="nb-search-box" onClick={e => e.stopPropagation()}>
            <div className="nb-search-input">
              <span style={{ fontSize: '1.1rem', color: 'var(--text-3)' }}>🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages & features…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') closeSearch();
                  if (e.key === 'Enter' && suggestions.length > 0) handleSuggestionClick(suggestions[0].path);
                }}
                autoComplete="off"
              />
              <kbd style={{
                padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border)',
                fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'inherit',
              }}>Esc</kbd>
            </div>

            {query.length === 0 && (
              <div style={{ padding: '10px 0' }}>
                <div style={{ padding: '6px 20px', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Quick Navigation
                </div>
                {allItems.map(item => (
                  <div key={item.path} className="nb-suggest-item" onClick={() => handleSuggestionClick(item.path)}>
                    <div className="nb-suggest-icon">{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{item.path}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {query.length > 0 && suggestions.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '6px 20px', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                </div>
                {suggestions.map(item => (
                  <div key={item.path} className="nb-suggest-item" onClick={() => handleSuggestionClick(item.path)}>
                    <div className="nb-suggest-icon">{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{item.path}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {query.length > 0 && suggestions.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: '0.85rem' }}>No results for "<strong>{query}</strong>"</div>
              </div>
            )}

            <div style={{
              padding: '10px 20px', borderTop: '1px solid var(--border-soft)',
              display: 'flex', gap: 16, fontSize: '0.7rem', color: 'var(--text-3)',
            }}>
              <span><kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'inherit' }}>↵</kbd> to navigate</span>
              <span><kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'inherit' }}>Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardNavbar;
