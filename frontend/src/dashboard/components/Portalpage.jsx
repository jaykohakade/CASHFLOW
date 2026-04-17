import React, { useState, useEffect, useCallback } from 'react';
import PortalForm from '../components/Portalform';
import PortalTable from '../components/Portaltable';
import PortalCards from '../components/Portalcards';
import '../../styles/Portal.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PortalPage = () => {
  const [portals, setPortals]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [editingPortal, setEditingPortal] = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [view, setView]                 = useState('table'); // 'table' | 'cards'

  /* ── Fetch ── */
  const fetchPortals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/portals`);
      if (!res.ok) throw new Error('Failed to fetch portals');
      const data = await res.json();
      setPortals(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPortals(); }, [fetchPortals]);

  /* ── Handlers ── */
  const handleCreate = async (formData) => {
    const res  = await fetch(`${API}/portals`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create portal');
    }
    const created = await res.json();
    setPortals(prev => [created, ...prev]);
    setShowForm(false);
  };

  const handleUpdate = async (formData) => {
    const res  = await fetch(`${API}/portals/${editingPortal.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update portal');
    }
    const updated = await res.json();
    setPortals(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPortal(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API}/portals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete portal');
    setPortals(prev => prev.filter(p => p.id !== id));
  };

  const openEdit = (portal) => {
    setEditingPortal(portal);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingPortal(null);
    setShowForm(false);
  };

  /* ── Metrics ── */
  const totalPortals   = portals.length;
  const avgCharge      = portals.length
    ? (portals.reduce((s, p) => s + Number(p.charge_per_transaction || 0), 0) / portals.length).toFixed(2)
    : '0.00';
  const maxCharge      = portals.length
    ? Math.max(...portals.map(p => Number(p.charge_per_transaction || 0))).toFixed(2)
    : '0.00';
  const uniqueCompanies = new Set(portals.map(p => p.company_name)).size;

  return (
    <div className="portal-page">
      {/* Header */}
      <div className="page-header">
        <span className="page-tag">Management</span>
        <h1 className="page-title">Portal <span>Management</span></h1>
        <p className="page-desc">Configure payment portals, manage companies and transaction charges.</p>
      </div>

      {/* Summary Cards */}
      <div className="portal-summary-grid">
        <div className="portal-summary-card portal-summary-blue">
          <div className="pscard-icon">🌐</div>
          <div className="pscard-info">
            <div className="pscard-value">{totalPortals}</div>
            <div className="pscard-label">Total Portals</div>
          </div>
        </div>
        <div className="portal-summary-card portal-summary-green">
          <div className="pscard-icon">🏢</div>
          <div className="pscard-info">
            <div className="pscard-value">{uniqueCompanies}</div>
            <div className="pscard-label">Companies</div>
          </div>
        </div>
        <div className="portal-summary-card portal-summary-amber">
          <div className="pscard-icon">💸</div>
          <div className="pscard-info">
            <div className="pscard-value">{avgCharge}%</div>
            <div className="pscard-label">Avg. Charge</div>
          </div>
        </div>
        <div className="portal-summary-card portal-summary-red">
          <div className="pscard-icon">📊</div>
          <div className="pscard-info">
            <div className="pscard-value">{maxCharge}%</div>
            <div className="pscard-label">Max Charge</div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="section-header" style={{ marginTop: 28 }}>
        <div>
          <div className="section-title">All Portals</div>
          <div className="section-subtitle">{portals.length} portal{portals.length !== 1 ? 's' : ''} registered</div>
        </div>
        <div className="portal-actions-row">
          {/* View toggle */}
          <div className="portal-view-toggle">
            <button
              className={`view-toggle-btn${view === 'table' ? ' active' : ''}`}
              onClick={() => setView('table')}
              title="Table View"
            >☰ Table</button>
            <button
              className={`view-toggle-btn${view === 'cards' ? ' active' : ''}`}
              onClick={() => setView('cards')}
              title="Card View"
            >⬛ Cards</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchPortals()}>🔄 Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingPortal(null); setShowForm(true); }}>
            ➕ Add Portal
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          ⚠️ {error}
          <button className="btn btn-ghost btn-xs" onClick={() => fetchPortals()} style={{ marginLeft: 12 }}>Retry</button>
        </div>
      )}

      {/* Main content */}
      {view === 'table'
        ? <PortalTable portals={portals} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
        : <PortalCards portals={portals} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
      }

      {/* Modal: Add / Edit Form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm} role="dialog" aria-modal="true">
          <div className="modal portal-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPortal ? '✏️ Edit Portal' : '🌐 Add New Portal'}
              </h2>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <div className="modal-body">
              <PortalForm
                initialData={editingPortal}
                onSubmit={editingPortal ? handleUpdate : handleCreate}
                onCancel={closeForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalPage;