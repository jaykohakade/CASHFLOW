import React from 'react';
import '../../styles/dashboard.css';

const NAV_ITEMS = {
  admin: [
    {
      section: 'Overview',
      items: [
        { icon: '📊', label: 'Dashboard',     path: '/admin',         badge: null },
        { icon: '🏢', label: 'Branches',      path: '/admin/branches',badge: null },
        { icon: '💳', label: 'Transactions',  path: '/admin/transactions', badge: 'Live' },
      ],
    },
    {
      section: 'Management',
      items: [
        { icon: '📈', label: 'Analytics',     path: '/admin/analytics',badge: null },
        { icon: '👥', label: 'Users',         path: '/admin/users',   badge: null },
        { icon: '📢', label: 'Notices',       path: '/admin/notices', badge: null },
        { icon: '⚙️', label: 'Settings',      path: '/admin/settings',badge: null },
      ],
    },
  ],
  branch: [
    {
      section: 'Operations',
      items: [
        { icon: '🏠', label: 'My Dashboard',  path: '/branch',         badge: null },
        { icon: '➕', label: 'Add Transaction',path: '/branch/add',    badge: null },
        { icon: '📋', label: 'My Transactions',path: '/branch/transactions', badge: null },
      ],
    },
    {
      section: 'Account',
      items: [
        { icon: '📊', label: 'My Reports',    path: '/branch/reports', badge: null },
        { icon: '📢', label: 'Notices',       path: '/branch/notices', badge: null },
        { icon: '⚙️', label: 'Settings',      path: '/branch/settings',badge: null },
      ],
    },
  ],
};

const Sidebar = ({
  role = 'admin',
  activePath = '',
  collapsed = false,
  onNavigate,
  userName = 'Admin User',
  onLogout,
}) => {
  const navGroups = NAV_ITEMS[role] || NAV_ITEMS.admin;
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Sidebar navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">₹</div>
        <span className="brand-text">Cash<em>flow</em></span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.section} style={{ marginBottom: '8px' }}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((item) => (
              <div
                key={item.path}
                className={`nav-item${activePath === item.path ? ' active' : ''}`}
                onClick={() => onNavigate && onNavigate(item.path)}
                title={collapsed ? item.label : undefined}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate(item.path)}
              >
                <div className="nav-icon">{item.icon}</div>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Logout */}
        <div
          className="nav-item"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onLogout && onLogout()}
          style={{ marginBottom: '8px', color: 'rgba(255,100,80,0.7)' }}
        >
          <div className="nav-icon">🚪</div>
          <span className="nav-label">Logout</span>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{role === 'admin' ? 'Administrator' : 'Branch Manager'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;