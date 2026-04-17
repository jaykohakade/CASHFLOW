import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../../styles/dashboard.css';

const API = 'http://localhost:5000/api';
const FILE_BASE = 'http://localhost:5000';
const REACTION_OPTIONS = ['👍', '❤️', '👀', '👏'];

const BranchNoticesPage = ({ user, onNoticesLoaded }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingReactionId, setSavingReactionId] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);

  const branchIdentity = useMemo(() => ({
    userId: user?.id || user?._id || user?.email || '',
    branchId: user?.branch?.id || user?.branch?._id || '',
    branchName: user?.branch?.name || '',
  }), [user]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const publishLoadedNotices = (nextNotices) => {
    if (typeof onNoticesLoaded === 'function') {
      onNoticesLoaded(nextNotices);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/notices`);
      const nextNotices = data.data || [];
      setNotices(nextNotices);
      publishLoadedNotices(nextNotices);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (noticeId, emoji) => {
    if (!branchIdentity.userId) return;

    try {
      setSavingReactionId(noticeId);
      const { data } = await axios.patch(`${API}/notices/${noticeId}/react`, {
        userId: branchIdentity.userId,
        branchId: branchIdentity.branchId,
        branchName: branchIdentity.branchName,
        emoji,
      });

      const updatedNotice = data.data;
      setNotices((prev) => {
        const nextNotices = prev.map((notice) => (
          notice._id === updatedNotice._id ? updatedNotice : notice
        ));
        publishLoadedNotices(nextNotices);
        return nextNotices;
      });
    } catch (err) {
      console.error('Reaction failed:', err);
    } finally {
      setSavingReactionId('');
    }
  };

  const getMyReaction = (notice) => (
    notice.reactions?.find((reaction) => reaction.userId === branchIdentity.userId)?.emoji || ''
  );

  const getReactionSummary = (notice) => {
    const summary = (notice.reactions || []).reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(summary);
  };

  const openPreview = (media) => setPreviewMedia(media);
  const closePreview = () => setPreviewMedia(null);

  if (loading) {
    return <div style={{ color: 'var(--text-3)', padding: 20 }}>Loading notices...</div>;
  }

  if (notices.length === 0) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>📢</div>
        <div>No notices available.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
      {notices.map((notice) => {
        const myReaction = getMyReaction(notice);
        const reactionSummary = getReactionSummary(notice);

        return (
          <div key={notice._id} className="panel" style={{ padding: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: 'var(--text-1)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {notice.emoji && <span>{notice.emoji}</span>}
                <span style={{ wordBreak: 'break-word' }}>{notice.title}</span>
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                  fontSize: '0.75rem',
                }}
              >
                Notice
              </span>
            </div>

            <p style={{ marginTop: 10, color: 'var(--text-2)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {notice.message}
            </p>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {notice.imageUrl && (
                <button
                  type="button"
                  onClick={() => openPreview({ type: 'image', url: `${FILE_BASE}${notice.imageUrl}`, title: notice.title })}
                  style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', minWidth: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
                >
                  <img
                    src={`${FILE_BASE}${notice.imageUrl}`}
                    alt="Notice attachment"
                    style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }}
                  />
                </button>
              )}
              {notice.audioUrl && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openPreview({ type: 'audio', url: `${FILE_BASE}${notice.audioUrl}`, title: notice.title })}
                  style={{ border: '1px solid var(--border)', minHeight: 54, justifyContent: 'center', width: '100%' }}
                >
                  Preview Audio
                </button>
              )}
              {notice.fileUrl && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => openPreview({ type: 'file', url: `${FILE_BASE}${notice.fileUrl}`, title: notice.title })}
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                  >
                    📄 Download File
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REACTION_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleReact(notice._id, emoji)}
                    disabled={savingReactionId === notice._id}
                    style={{
                      border: '1px solid var(--border)',
                      background: myReaction === emoji ? 'rgba(124,58,237,0.12)' : 'transparent',
                      minWidth: 56,
                    }}
                  >
                    {emoji}
                  </button>
                ))}
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
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <span>Posted on: {new Date(notice.createdAt).toLocaleString('en-IN')}</span>
              {myReaction && <span>Your reaction: {myReaction}</span>}
            </div>
          </div>
        );
      })}

      {previewMedia && (
        <div className="modal-overlay" onClick={closePreview} role="dialog" aria-modal="true">
          <div
            className="modal"
            style={{ maxWidth: 760, width: 'calc(100vw - 24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{previewMedia.title || 'Notice Media'}</h2>
              <button className="modal-close" onClick={closePreview}>✕</button>
            </div>
            <div className="modal-body">
              {previewMedia.type === 'image' && (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title || 'Notice media'}
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 10, display: 'block' }}
                />
              )}
              {previewMedia.type === 'audio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Audio preview</div>
                  <audio controls autoPlay style={{ width: '100%' }}>
                    <source src={previewMedia.url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {previewMedia.type === 'file' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    This notice has an attached file. Open it in a new tab to view or download.
                  </div>
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchNoticesPage;
