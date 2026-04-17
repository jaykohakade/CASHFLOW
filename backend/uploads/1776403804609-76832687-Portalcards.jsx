import React, { useState } from 'react';

/* Deterministic accent color per portal name */
const ACCENTS = ['purple', 'olive', 'green', 'blue', 'amber'];
const accentFor = (name = '') => ACCENTS[name.charCodeAt(0) % ACCENTS.length];

const PortalCards = ({ portals, loading, onEdit, onDelete }) => {
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="portal-cards-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="portal-card">
            <div className="skeleton" style={{ height: 160, borderRadius: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  /* Empty state */
  if (!portals.length) {
    return (
      <div className="panel portal-panel">
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <div className="empty-title">No portals found</div>
          <div className="empty-desc">Add your first payment portal to start managing transactions.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="portal-cards-grid">
        {portals.map(portal => {
          const accent = accentFor(portal.portal_name);
          return (
            <div key={portal.id} className={`portal-card portal-card-${accent}`}>
              {/* Card Header */}
              <div className="pcard-header">
                <div className={`portal-avatar portal-avatar-${accent}`}>
                  {(portal.portal_name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="pcard-actions">
                  <button
                    className="btn btn-ghost btn-icon btn-xs"
                    onClick={() => onEdit(portal)}
                    title="Edit"
                  >✏️</button>
                  <button
                    className="btn btn-danger btn-icon btn-xs"
                    onClick={() => { setDeleteId(portal.id); setDeleteError(''); }}
                    title="Delete"
                  >🗑</button>
                </div>
              </div>

              {/* Card Body */}
              <div className="pcard-body">
                <div className="pcard-portal-name">{portal.portal_name}</div>
                <div className="pcard-company">
                  <span>🏢</span> {portal.company_name}
                </div>
              </div>

              {/* Card Stats */}
              <div className="pcard-stats">
                <div className="pcard-stat">
                  <div className={`pcard-stat-value pcard-charge-${accent}`}>
                    {Number(portal.charge_per_transaction).toFixed(2)}%
                  </div>
                  <div className="pcard-stat-key">Per Transaction</div>
                </div>
                <div className="pcard-divider" />
                <div className="pcard-stat">
                  <div className="pcard-stat-value" style={{ fontSize: '0.8rem' }}>
                    {fmtDate(portal.created_at)}
                  </div>
                  <div className="pcard-stat-key">Created</div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pcard-footer">
                <span className="badge badge-green">🟢 Active</span>
                <span className="pcard-id">ID #{portal.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteId(null)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Delete Portal</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)} disabled={deleting}>✕</button>
            </div>
            <div className="modal-body">
              {deleteError && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{deleteError}</div>}
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                Are you sure you want to delete this portal? This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : '🗑 Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortalCards;