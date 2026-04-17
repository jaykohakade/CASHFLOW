import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/dashboard.css';

const API = 'http://localhost:5000/api';

const Noticespage = ({ isAdmin }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', message: '', emoji: '', image: null, file: null, audio: null });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/notices`);
      setNotices(data.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      setError('Title and message are required.');
      return;
    }
    setError('');
    
    const form = new FormData();
    form.append('title', formData.title);
    form.append('message', formData.message);
    form.append('emoji', formData.emoji);
    if (formData.image) form.append('image', formData.image);
    if (formData.file) form.append('file', formData.file);
    if (formData.audio) form.append('audio', formData.audio);

    try {
      if (formData.id) {
        await axios.put(`${API}/notices/${formData.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API}/notices`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      resetForm();
      fetchNotices();
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save notice. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await axios.delete(`${API}/notices/${id}`);
      fetchNotices();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (notice) => {
    setFormData({
      id: notice._id,
      title: notice.title,
      message: notice.message,
      emoji: notice.emoji || '',
      image: null,
      file: null,
      audio: null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', message: '', emoji: '', image: null, file: null, audio: null });
    setError('');
  };

  const getReactionSummary = (notice) => {
    const summary = (notice.reactions || []).reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(summary);
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowModal(true); }}>
            ➕ Create Notice
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-3)', padding: 20 }}>Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>📢</div>
          <div>No notices available.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map((notice) => {
            const reactionSummary = getReactionSummary(notice);

            return (
            <div key={notice._id} className="panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--text-1)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notice.emoji && <span>{notice.emoji}</span>}
                  {notice.title}
                </h3>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(notice)}>✏️</button>
                    <button className="btn btn-danger btn-icon btn-xs" onClick={() => handleDelete(notice._id)}>🗑</button>
                  </div>
                )}
              </div>
              <p style={{ marginTop: 10, color: 'var(--text-2)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {notice.message}
              </p>
              
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {notice.imageUrl && (
                  <div style={{ maxWidth: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={`http://localhost:5000${notice.imageUrl}`} alt="Notice attachment" style={{ width: '100%', display: 'block' }} />
                  </div>
                )}
                {notice.audioUrl && (
                  <div style={{ marginTop: 8, width: '100%' }}>
                    <audio controls style={{ height: 35 }}>
                      <source src={`http://localhost:5000${notice.audioUrl}`} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {notice.fileUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a href={`http://localhost:5000${notice.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      📄 Download File
                    </a>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-3)' }}>
                Posted on: {new Date(notice.createdAt).toLocaleString('en-IN')}
              </div>
              {isAdmin && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)' }}>
                      Branch Reactions
                    </div>
                    {reactionSummary.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {reactionSummary.map(([emoji, count]) => (
                          <span
                            key={emoji}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--border)',
                              color: 'var(--text-2)',
                              fontSize: '0.76rem',
                            }}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!notice.reactions || notice.reactions.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                      No branch reactions yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {notice.reactions
                        .slice()
                        .sort((a, b) => new Date(b.reactedAt) - new Date(a.reactedAt))
                        .map((reaction, index) => (
                          <div
                            key={`${reaction.userId}-${reaction.emoji}-${index}`}
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 12,
                              padding: '10px 12px',
                              background: 'var(--panel-2, rgba(255,255,255,0.02))',
                              minWidth: 0,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)', minWidth: 0, wordBreak: 'break-word' }}>
                                {reaction.branchName || 'Unknown Branch'}
                              </div>
                              <div style={{ fontSize: '1rem', flexShrink: 0 }}>{reaction.emoji}</div>
                            </div>
                            <div style={{ marginTop: 6, fontSize: '0.74rem', color: 'var(--text-3)' }}>
                              Reacted on {new Date(reaction.reactedAt).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{formData.id ? 'Edit Notice' : 'Create Notice'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="Notice Title" required />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Emoji Icon</label>
                    <input type="text" className="form-control" name="emoji" value={formData.emoji} onChange={handleChange} placeholder="e.g. 🚀" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-control" name="message" value={formData.message} onChange={handleChange} placeholder="Write your notice here..." rows="4" required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Attach Image (Optional)</label>
                  <input type="file" className="form-control" name="image" accept="image/*" onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Attach Audio (Optional)</label>
                  <input type="file" className="form-control" name="audio" accept="audio/*" onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Attach File (Optional)</label>
                  <input type="file" className="form-control" name="file" onChange={handleChange} />
                </div>

                <div className="modal-footer" style={{ padding: 0, paddingTop: 14 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">💾 {formData.id ? 'Update' : 'Publish'} Notice</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Noticespage;
