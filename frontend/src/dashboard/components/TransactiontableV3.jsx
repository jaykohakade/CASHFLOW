import React, { useState, useMemo } from 'react';
import '../../styles/dashboard.css';
import '../../styles/table.css';

const PORTAL_COLORS = {
  HDFC: '#004c97',
  ICICI: '#cc2f2d',
  AXIS: '#800000',
  SBI: '#2d5f8b',
  KOTAK: '#cc3300',
  YES: '#003478',
  PNB: '#0056a2',
  DEFAULT: '#808034',
};

const formatCurrency = (val) => {
  if (val === null || val === undefined) return '—';
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ROWS_PER_PAGE = 10;

const TransactionTable = ({ transactions = [], branches = [], showBranchColumn = true, loading = false, onDelete }) => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    let rows = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.portal?.toLowerCase().includes(q) ||
        r.transaction_type?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.mobile_number?.toLowerCase().includes(q) ||
        r.branch_name?.toLowerCase().includes(q) ||
        String(r.amount).includes(q)
      );
    }

    if (branchFilter !== 'all') rows = rows.filter((r) => String(r.branch_id) === branchFilter);
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);

    rows.sort((a, b) => {
      let va = a[sortKey] ?? '';
      let vb = b[sortKey] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [transactions, search, branchFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totals = useMemo(() => ({
    amount: filtered.reduce((s, r) => s + Number(r.amount || 0), 0),
    charges: filtered.reduce((s, r) => s + Number(r.charges || 0), 0),
    bill_pay_charges: filtered.reduce((s, r) => s + Number(r.bill_pay_charges || 0), 0),
    profit: filtered.reduce((s, r) => s + Number(r.profit || 0), 0),
  }), [filtered]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const allOnPage = paginated.map((r) => r.id);
  const allSelected = allOnPage.length > 0 && allOnPage.every((id) => selected.includes(id));
  const toggleAll = () => setSelected(allSelected ? [] : [...selected, ...allOnPage.filter((id) => !selected.includes(id))]);
  const toggleRow = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const exportExcel = () => {
    const rows = filtered.map((r) => ({
      Date: r.date,
      Portal: r.portal,
      'Transaction Type': r.transaction_type,
      'Customer Name': r.customer_name,
      'Mobile Number': r.mobile_number,
      'Card Digit': r.card_digit,
      'Bank Account': r.bank_account,
      'Bill Pay Charges (₹)': r.bill_pay_charges,
      Branch: r.branch_name || r.branch_id,
      'Amount (₹)': r.amount,
      'Charges (₹)': r.charges,
      'Profit (₹)': r.profit,
    }));

    const headers = Object.keys(rows[0] || {});
    const csvRows = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ThSort = ({ label, sortK }) => (
    <div
      className={`th-sortable${sortKey === sortK ? ' sorted' : ''}`}
      onClick={() => handleSort(sortK)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSort(sortK)}
    >
      {label}
      <span className="th-sort-icon">{sortKey === sortK ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
    </div>
  );

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div style={{ flex: 1 }}>
          <div className="table-toolbar-title">Transactions</div>
          <div className="table-toolbar-subtitle">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</div>
        </div>

        <div className="table-filters">
          <div className="table-search">
            <span className="table-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search portal, customer, branch..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search transactions"
            />
          </div>

          {showBranchColumn && (
            <select className="filter-select" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} aria-label="Filter by branch">
              <option value="all">All Branches</option>
              {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          )}

          <div className="date-filter">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span className="date-separator">–</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} aria-label="To date" />
          </div>

          <button className="btn-export" onClick={exportExcel} title="Export to Excel/CSV"><span>⬇</span> Excel</button>
        </div>
      </div>

      <div className="table-scroll">
        {loading ? (
          <div style={{ padding: 40 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 8 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon">📭</div>
            <div className="table-empty-text">No transactions match your filters</div>
          </div>
        ) : (
          <table className="data-table" role="table">
            <thead>
              <tr>
                <th className="th-check"><input type="checkbox" className="row-checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                <th><ThSort label="#" sortK="id" /></th>
                <th><ThSort label="Date" sortK="date" /></th>
                <th><ThSort label="Portal" sortK="portal" /></th>
                <th><ThSort label="Type" sortK="transaction_type" /></th>
                <th><ThSort label="Customer" sortK="customer_name" /></th>
                <th><ThSort label="Mobile" sortK="mobile_number" /></th>
                <th><ThSort label="Card" sortK="card_digit" /></th>
                <th><ThSort label="Bank" sortK="bank_account" /></th>
                <th><ThSort label="Pay-Charges" sortK="bill_pay_charges" /></th>
                {showBranchColumn && <th><ThSort label="Branch" sortK="branch_name" /></th>}
                <th><ThSort label="Amount" sortK="amount" /></th>
                <th><ThSort label="Charges" sortK="charges" /></th>
                <th><ThSort label="Portal Fee" sortK="portal_charges" /></th>
                <th><ThSort label="Profit" sortK="profit" /></th>
                {onDelete && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  <td className="td-check"><input type="checkbox" className="row-checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select row ${row.id}`} /></td>
                  <td className="td-number" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>#{(page - 1) * ROWS_PER_PAGE + idx + 1}</td>
                  <td className="td-date">{formatDate(row.date)}</td>
                  <td>
                    <div className="td-portal">
                      <span className="portal-dot" style={{ background: PORTAL_COLORS[row.portal?.toUpperCase()] || PORTAL_COLORS.DEFAULT }} />
                      <span style={{ fontWeight: 600 }}>{row.portal}</span>
                    </div>
                  </td>
                  <td>{row.transaction_type || '—'}</td>
                  <td>{row.customer_name || '—'}</td>
                  <td>{row.mobile_number || '—'}</td>
                  <td>{row.card_digit || '—'}</td>
                  <td>{row.bank_account || '—'}</td>
                  <td>{formatCurrency(row.bill_pay_charges)}</td>
                  {showBranchColumn && (
                    <td>
                      <div className="td-branch">
                        <div className="td-branch-dot">{(row.branch_name || 'B').charAt(0).toUpperCase()}</div>
                        {row.branch_name || `Branch #${row.branch_id}`}
                      </div>
                    </td>
                  )}
                  <td className="td-amount">{formatCurrency(row.amount)}</td>
                  <td className="td-charges">{formatCurrency(row.charges)}</td>
                  <td className="td-expense">{formatCurrency(row.portal_charges)}</td>
                  <td className="td-profit">{formatCurrency(row.profit)}</td>
                  {onDelete && <td><div className="td-actions"><button className="btn btn-danger btn-xs" onClick={() => onDelete(row.id)} title="Delete transaction">🗑</button></div></td>}
                </tr>
              ))}

              {filtered.length > 0 && (
                <tr className="table-summary-row">
                  <td colSpan={showBranchColumn ? 11 : 10} style={{ fontWeight: 700, paddingLeft: 16 }}>Totals ({filtered.length} records)</td>
                  <td className="td-amount">{formatCurrency(totals.amount)}</td>
                  <td className="td-charges">{formatCurrency(totals.charges)}</td>
                  <td />
                  <td className="td-profit">{formatCurrency(totals.profit)}</td>
                  {onDelete && <td />}
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
