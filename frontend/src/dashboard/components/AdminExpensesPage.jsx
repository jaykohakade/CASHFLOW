import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtINR = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ROWS_PER_PAGE = 15;

const inputStyle = {
  background: 'var(--input-bg,rgba(255,255,255,0.05))',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--text-1)',
  fontSize: '0.83rem',
  outline: 'none',
};

const AdminExpensesPage = ({ branches = [] }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── filters ── */
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchFilter) params.set('branch_id', branchFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const { data } = await axios.get(`${API}/expenses?${params.toString()}`);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /* ── client-side search (name, note, branch) ── */
  const filtered = React.useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (r) =>
        (r.expense_name || '').toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q) ||
        (r.branch_name || '').toLowerCase().includes(q) ||
        String(r.amount).includes(q)
    );
  }, [expenses, search]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totalAmount = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  /* ── Summary by branch ── */
  const branchSummary = React.useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const k = r.branch_id;
      if (!map[k]) map[k] = { name: r.branch_name || `Branch #${r.branch_id}`, total: 0, count: 0 };
      map[k].total += Number(r.amount || 0);
      map[k].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Failed to delete expense.');
    }
  };

  /* ── Export CSV ── */
  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Date', 'Branch', 'Expense Name', 'Amount (₹)', 'Note'];
    const rows = filtered.map((r) => [
      (r.date || '').slice(0, 10),
      r.branch_name || r.branch_id,
      r.expense_name,
      r.amount,
      r.note || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-all-branches-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setBranchFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = search || branchFilter || dateFrom || dateTo;

  return (
    <>
      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { icon: '💸', label: 'Total Expenses', value: fmtINR(totalAmount), color: '#f87171' },
          { icon: '📋', label: 'Records', value: filtered.length, color: 'var(--text-1)' },
          { icon: '🏢', label: 'Branches', value: branchSummary.length, color: '#7c3aed' },
        ].map((card) => (
          <div key={card.label} style={{
            flex: '1 1 160px', background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Branch Summary Mini-Cards */}
      {branchSummary.length > 0 && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)', marginBottom: 14 }}>🏢 Expenses by Branch</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {branchSummary.map((b) => (
              <div key={b.name} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 16px', minWidth: 150 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{b.name}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f87171' }}>{fmtINR(b.total)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>{b.count} record{b.count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>📋 All Expense Records</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''} · across all branches
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none', color: 'var(--text-3)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search name, note, branch…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle, paddingLeft: 30, width: '100%' }}
            />
          </div>

          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, cursor: 'pointer', flex: '0 1 160px', background: 'var(--panel)' }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={{ ...inputStyle, width: 'auto' }} />
            <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>–</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={{ ...inputStyle, width: 'auto' }} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              ✕ Clear
            </button>
          )}

          <button onClick={fetchExpenses}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            🔄 Refresh
          </button>

          <button onClick={exportCSV}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary,#723480)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            ⬇ Excel
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 42, marginBottom: 8, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: '0.9rem' }}>No expenses match your filters</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.18)' }}>
                  {['#', 'Date', 'Branch', 'Expense Name', 'Amount', 'Note', 'Action'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 14px',
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      color: 'var(--text-3)', fontWeight: 700, fontSize: '0.73rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, idx) => (
                  <tr key={row.id || idx}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', color: 'var(--text-3)', fontSize: '0.75rem' }}>
                      #{(page - 1) * ROWS_PER_PAGE + idx + 1}
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>
                      {formatDate(row.date)}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'rgba(124,58,237,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.78rem', color: '#7c3aed', flexShrink: 0
                        }}>
                          {(row.branch_name || 'B').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                          {row.branch_name || `Branch #${row.branch_id}`}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-1)' }}>
                      {row.expense_name}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#f87171', whiteSpace: 'nowrap' }}>
                      {fmtINR(row.amount)}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.note || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr style={{ background: 'rgba(0,0,0,0.12)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '11px 14px', color: 'var(--text-2)', fontSize: '0.83rem' }}>
                    Totals ({filtered.length} records)
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: '#f87171', fontSize: '0.9rem' }}>
                    {fmtINR(totalAmount)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: page === p ? 'var(--primary,#723480)' : 'transparent', color: page === p ? '#fff' : 'var(--text-2)', cursor: 'pointer', fontWeight: page === p ? 700 : 400, fontSize: '0.82rem' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>›</button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminExpensesPage;
