import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/dashboard.css';

const API = 'http://localhost:5000/api';

const AdminEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Email Reply Modal State
  const [replyModal, setReplyModal] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchEnquiries = async () => {
    try {
      const { data } = await axios.get(`${API}/enquiries`);
      setEnquiries(data);
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    try {
      await axios.patch(`${API}/enquiries/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to change status:', err);
      fetchEnquiries(); // revert on fail
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    setEnquiries(prev => prev.filter(e => e.id !== id));
    try {
      await axios.delete(`${API}/enquiries/${id}`);
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
      fetchEnquiries(); // revert
    }
  };

  // Automated Email Backend Integration
  const openReplyModal = (enq) => {
    setReplyBody(`Hi ${enq.name},\n\nThank you for reaching out to Cashflow. We received your message:\n"${enq.message}"\n\n[Type your response here...]\n\nBest regards,\nBranch Management Team\nCashflow`);
    setReplyModal(enq);
  };

  const handleSendEmail = async () => {
    if (!replyModal) return;
    setSending(true);
    try {
      const payload = {
        to: replyModal.email,
        subject: "Re: Your Inquiry at Cashflow",
        body: replyBody
      };
      await axios.post(`${API}/enquiries/${replyModal.id}/reply`, payload);
      // Success update
      setEnquiries(prev => prev.map(e => e.id === replyModal.id ? { ...e, status: 'replied' } : e));
      setReplyModal(null);
      alert("✅ Automated email dispatched successfully to the customer!");
    } catch (err) {
      console.error("Email send failed:", err);
      alert("Failed to send the email. Ensure backend SMTP is configured.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading enquiries...</div>;
  }

  return (
    <>
      <div className="page-header">
        <span className="page-tag">Communication</span>
        <h1 className="page-title">Customer <span>Enquiries</span></h1>
        <p className="page-desc">Manage inbound messages directly from your website visitors.</p>
      </div>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>📬 Inbox</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
              {enquiries.length} conversation{enquiries.length !== 1 ? 's' : ''}
            </div>
          </div>

          <button onClick={fetchEnquiries}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            🔄 Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {enquiries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: '0.9rem' }}>No enquiries found.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(180, 180, 180, 0.18)' }}>
                  {['Date', 'Customer', 'Contact Details', 'Message', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 14px',
                      textAlign: 'left',
                      color: 'var(--text-6)', fontWeight: 700, fontSize: '0.73rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enquiries.map(enq => (
                  <tr key={enq.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'all .15s', opacity: enq.status === 'replied' ? 0.7 : 1 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', color: 'var(--text-3)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(enq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                        {new Date(enq.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-1)' }}>
                      {enq.name}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div><a href={`mailto:${enq.email}`} style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>{enq.email}</a></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 2 }}>
                        <a href={`tel:${enq.mobile}`} style={{ color: 'var(--text-2)', textDecoration: 'none' }}>+91 {enq.mobile}</a>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', maxWidth: 300, whiteSpace: 'normal', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                      {enq.message}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <select 
                        value={enq.status} 
                        onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                        style={{
                          background: enq.status === 'unread' ? 'rgba(255,100,80,0.1)' : enq.status === 'read' ? 'rgba(50,150,255,0.1)' : 'rgba(50,200,100,0.1)',
                          color: enq.status === 'unread' ? '#f87171' : enq.status === 'read' ? '#60a5fa' : '#4ade80',
                          border: '1px solid transparent',
                          borderRadius: 8,
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                        }}
                      >
                        <option value="unread">🔴 Unread</option>
                        <option value="read">🔵 Read</option>
                        <option value="replied">🟢 Replied</option>
                      </select>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(124,58,237,0.15)', color: '#8f73ffff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} 
                          onClick={() => openReplyModal(enq)}
                        >
                          ✉️ Reply
                        </button>
                        <button 
                          style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          onClick={() => handleDelete(enq.id)} 
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Automated Email Modal Overlay */}
      {replyModal && (
        <div className="modal-overlay" onClick={() => setReplyModal(null)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2em' }}>✉️</span> Reply to Customer
              </h2>
              <button className="modal-close" onClick={() => setReplyModal(null)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '0 24px' }}>
              <div style={{ padding: '12px 14px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>To Recipient</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                  {replyModal.name} <span style={{ color: 'var(--purple)', fontWeight: 500 }}>&lt;{replyModal.email}&gt;</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Email Message</label>
                <textarea 
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%',
                    background: 'var(--input-bg, rgba(0,0,0,0.15))',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 14,
                    color: 'var(--text-1)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 8, padding: '20px 24px', borderTop: 'none' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setReplyModal(null)}>Cancel</button>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleSendEmail}
                disabled={sending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)' }}
              >
                {sending ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Sending Server Data...
                  </>
                ) : '🚀 Send over Mail Server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEnquiriesPage;
