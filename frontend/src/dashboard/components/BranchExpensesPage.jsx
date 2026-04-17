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

const ROWS_PER_PAGE = 10;

const inputStyle = {
  background: 'var(--input-bg,rgba(255,255,255,0.05))',
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '10px 14px',
  color: 'var(--text-1)',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none',
  transition: 'border-color .2s',
};

/* ── Expense Form ── */
const ExpenseForm = ({ branchId, onSuccess }) => {
  const [form, setForm] = useState({ expense_name: '', amount: '', date: '', note: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.expense_name.trim()) e.expense_name = 'Expense name is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid positive amount';
    if (!form.date) e.date = 'Date is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/expenses`, {
        branch_id: branchId,
        expense_name: form.expense_name.trim(),
        amount: Number(form.amount),
        date: form.date,
        note: form.note.trim(),
      });
      setSuccessMsg('✅ Expense recorded successfully!');
      setForm({ expense_name: '', amount: '', date: '', note: '' });
      onSuccess && onSuccess(data);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || '';
      const detail = err.response?.data?.error ? ` (${err.response.data.error})` : '';
      setErrors({ _api: serverMsg ? `${serverMsg}${detail}` : `Failed to save expense — ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px 26px',
      marginBottom: 28,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)', marginBottom: 4 }}>
        💸 Add New Expense
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 20 }}>
        Record a branch expense below.
      </div>

      {successMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 600, fontSize: '0.85rem', marginBottom: 16 }}>
          {successMsg}
        </div>
      )}
      {errors._api && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: '0.85rem', marginBottom: 16 }}>
          {errors._api}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
          {/* Expense Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Expense Name <span style={{ color: 'var(--red,#f87171)' }}>*</span>
            </label>
            <input
              id="exp-name"
              type="text"
              placeholder="e.g. Office Supplies"
              value={form.expense_name}
              onChange={(e) => set('expense_name', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.expense_name ? 'var(--red,#f87171)' : undefined }}
            />
            {errors.expense_name && <div style={{ fontSize: '0.74rem', color: 'var(--red,#f87171)', marginTop: 4 }}>{errors.expense_name}</div>}
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Amount (₹) <span style={{ color: 'var(--red,#f87171)' }}>*</span>
            </label>
            <input
              id="exp-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.amount ? 'var(--red,#f87171)' : undefined }}
            />
            {errors.amount && <div style={{ fontSize: '0.74rem', color: 'var(--red,#f87171)', marginTop: 4 }}>{errors.amount}</div>}
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Date <span style={{ color: 'var(--red,#f87171)' }}>*</span>
            </label>
            <input
              id="exp-date"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.date ? 'var(--red,#f87171)' : undefined }}
            />
            {errors.date && <div style={{ fontSize: '0.74rem', color: 'var(--red,#f87171)', marginTop: 4 }}>{errors.date}</div>}
          </div>

          {/* Note */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Note <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="exp-note"
              type="text"
              placeholder="Any additional details…"
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 9, border: 'none',
            background: 'var(--primary,#723480)', color: '#fff',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity .2s',
          }}
        >
          {loading ? '⏳ Saving…' : '💾 Save Expense'}
        </button>
      </form>
    </div>
  );
};

/* ── Expense Table ── */
const ExpenseTable = ({ expenses, loading, onDelete }) => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = React.useMemo(() => {
    let rows = [...expenses];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.expense_name || '').toLowerCase().includes(q) ||
          (r.note || '').toLowerCase().includes(q) ||
          String(r.amount).includes(q)
      );
    }
    if (dateFrom) rows = rows.filter((r) => (r.date || '').slice(0, 10) >= dateFrom);
    if (dateTo) rows = rows.filter((r) => (r.date || '').slice(0, 10) <= dateTo);
    return rows;
  }, [expenses, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const totalAmount = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Date', 'Expense Name', 'Amount (₹)', 'Note'];
    const rows = filtered.map((r) => [
      (r.date || '').slice(0, 10),
      r.expense_name,
      r.amount,
      r.note || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-1)' }}>
            📋 Expense Records
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none', color: 'var(--text-3)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search name or note…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 30, fontSize: '0.83rem' }}
          />
        </div>

        {/* Date range */}
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          style={{ ...inputStyle, width: 'auto', fontSize: '0.83rem', flex: '0 1 140px' }} />
        <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>–</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          style={{ ...inputStyle, width: 'auto', fontSize: '0.83rem', flex: '0 1 140px' }} />

        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >✕ Clear</button>
        )}

        <button
          onClick={exportCSV}
          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary,#723480)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
        >⬇ Excel</button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: '0.9rem' }}>No expenses match your filters</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.18)' }}>
                {['#', 'Date', 'Expense Name', 'Amount', 'Note', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Amount' ? 'right' : 'left', color: 'var(--text-3)', fontWeight: 700, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', color: 'var(--text-3)', fontSize: '0.75rem' }}>#{(page - 1) * ROWS_PER_PAGE + idx + 1}</td>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{formatDate(row.date)}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-1)' }}>{row.expense_name}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: '#f87171' }}>{fmtINR(row.amount)}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.note || '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {onDelete && (
                      <button onClick={() => onDelete(row.id)}
                        style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        🗑 Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr style={{ background: 'rgba(0,0,0,0.12)', fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: '11px 14px', color: 'var(--text-2)', fontSize: '0.83rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
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
  );
};

/* ── Main Component ── */
const BranchExpensesPage = ({ branchId, branchName }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${API}/expenses?branch_id=${branchId}`);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleExpenseAdded = (newExp) => {
    setExpenses((prev) => [newExp, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert('Failed to delete expense. Please try again.');
    }
  };

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <>
      <div className="page-header">
        <span className="page-tag">Finance</span>
        <h1 className="page-title">{branchName} <span>Expenses</span></h1>
        <p className="page-desc">Record and manage branch expenses.</p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { icon: '💸', label: 'Total Expenses', value: fmtINR(totalAmount), color: '#f87171' },
          { icon: '📋', label: 'Records', value: expenses.length, color: 'var(--text-1)' },
        ].map((card) => (
          <div key={card.label} style={{
            flex: '1 1 180px', background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <ExpenseForm branchId={branchId} onSuccess={handleExpenseAdded} />
      <ExpenseTable expenses={expenses} loading={loading} onDelete={handleDelete} />
    </>
  );
};

export default BranchExpensesPage;
