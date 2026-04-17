import React, { useState } from 'react';

const PortalTable = ({ portals, loading, onEdit, onDelete }) => {
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [deleteError,setDeleteError]= useState('');

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
      <div className="panel portal-panel">
        <table className="portal-table">
          <thead>
            <tr>
              {['#', 'Portal Name', 'Company', 'Charge %', 'Created', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1,2,3,4].map(i => (
              <tr key={i}>
                {Array(6).fill(0).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4, width: j === 5 ? 80 : '70%' }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
      <div className="panel portal-panel portal-table-wrap">
        <table className="portal-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Portal Name</th>
              <th>Company</th>
              <th>Charge / Txn</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portals.map((portal, idx) => (
              <tr key={portal.id} className="portal-row">
                <td className="portal-idx">{idx + 1}</td>
                <td>
                  <div className="portal-name-cell">
                    <div className="portal-avatar-sm">
                      {(portal.portal_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="portal-name-text">{portal.portal_name}</span>
                  </div>
                </td>
                <td>
                  <span className="portal-company">{portal.company_name}</span>
                </td>
                <td>
                  <span className="portal-charge-badge">
                    {Number(portal.charge_per_transaction).toFixed(2)}%
                  </span>
                </td>
                <td className="portal-date">{fmtDate(portal.created_at)}</td>
                <td>
                  <div className="portal-action-btns">
                    <button
                      className="btn btn-ghost btn-xs portal-edit-btn"
                      onClick={() => onEdit(portal)}
                      title="Edit Portal"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => { setDeleteId(portal.id); setDeleteError(''); }}
                      title="Delete Portal"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                Are you sure you want to delete this portal? This action <strong>cannot be undone</strong> and may affect linked transactions.
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

export default PortalTable;