import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/dashboard.css';
import '../../styles/form.css';

const DEFAULT_PORTAL_RATE = 0;
const TRANSACTION_TYPE_RATES = {
  'CC Withdrawal': 0.025,
  'CC Bill Payment': 0.035,
};

const createInitialForm = () => ({
  date: new Date().toISOString().split('T')[0],
  portal: '',
  transaction_type: 'CC Withdrawal',
  card_digit: '',
  customer_name: '',
  mobile_number: '',
  bank_account: '',
  bill_pay_charges: '0',
  amount: '',
});

const fmt = (n) => (isNaN(n) ? '0.00' : Number(n).toFixed(2));
const fmtINR = (n) => `₹${fmt(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const AddTransactionForm = ({
  branchId,
  onSuccess,
  apiBase = 'http://localhost:5000/api',
  portals = [],
}) => {
  const [form, setForm] = useState(createInitialForm);
  const [calc, setCalc] = useState({ charges: 0, portal_charges: 0, bill_pay_charges: 0, profit: 0 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  const selectedPortal = portals.find((p) => p.portal_name === form.portal);

  useEffect(() => {
    const amt = parseFloat(form.amount) || 0;
    const portalRate = selectedPortal
      ? Number(selectedPortal.charge_per_transaction) / 100
      : DEFAULT_PORTAL_RATE;
    const ourRate = TRANSACTION_TYPE_RATES[form.transaction_type] || TRANSACTION_TYPE_RATES['CC Withdrawal'];
    const billPayCharges = Number(form.bill_pay_charges || 0);

    setCalc(prev => {
      const newCalc = {
        charges: amt * ourRate,
        portal_charges: amt * portalRate,
        bill_pay_charges: billPayCharges,
        profit: amt * ourRate - amt * portalRate - billPayCharges,
      };

      return JSON.stringify(prev) === JSON.stringify(newCalc) ? prev : newCalc;
    });

  }, [form.amount, form.transaction_type, form.bill_pay_charges, selectedPortal]);

  const validate = () => {
    const errs = {};

    if (!form.date) errs.date = 'Date is required';
    if (!form.portal) errs.portal = 'Portal name is required';
    if (!form.transaction_type) errs.transaction_type = 'Transaction type is required';
    if (!/^\d{4}$/.test(form.card_digit)) errs.card_digit = 'Enter last 4 card digits';
    if (!form.customer_name.trim()) errs.customer_name = 'Customer name is required';
    if (!/^\d{10,15}$/.test(form.mobile_number)) errs.mobile_number = 'Enter a valid mobile number';
    if (!form.bank_account.trim()) errs.bank_account = 'Bank account is required';
    if (
      (form.transaction_type === 'CC Bill Payment' ||
        form.transaction_type === 'CC Withdrawal') &&
      (!form.bill_pay_charges || isNaN(form.bill_pay_charges) || Number(form.bill_pay_charges) < 0)
    ) {
      errs.bill_pay_charges = 'Enter a valid bill pay charges amount';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;

    if (name === 'card_digit' || name === 'mobile_number') {
      nextValue = value.replace(/\D/g, '');
    }
    else if (name === 'bill_pay_charges' || name === 'amount') {
      nextValue = value
        .replace(/[^0-9.]/g, '')        // allow only numbers + dot
        .replace(/(\..*?)\..*/g, '$1'); // only ONE dot
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    setApiError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    const payload = {
      branch_id: branchId,
      date: form.date,
      portal: form.portal,
      transaction_type: form.transaction_type,
      card_digit: form.card_digit,
      customer_name: form.customer_name.trim(),
      mobile_number: form.mobile_number,
      bank_account: form.bank_account.trim(),
      bill_pay_charges: parseFloat(form.bill_pay_charges || 0),
      amount: parseFloat(form.amount),
      charges: parseFloat(calc.charges.toFixed(2)),
      portal_charges: parseFloat(calc.portal_charges.toFixed(2)),
      profit: parseFloat(calc.profit.toFixed(2)),
    };

    try {
      const { data } = await axios.post(`${apiBase}/transactions`, payload);
      setSubmitted(true);
      setForm(createInitialForm());
      setCalc({ charges: 0, portal_charges: 0, bill_pay_charges: 0, profit: 0 });
      await Promise.resolve(onSuccess?.(data));
      setTimeout(() => setSubmitted(false), 3500);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(createInitialForm());
    setErrors({});
    setApiError('');
  };

  const ourRateLabel = ((TRANSACTION_TYPE_RATES[form.transaction_type] || 0) * 100).toFixed(1);

  return (
    <div className="form-card">
      <div className="form-card-header">
        <div className="form-card-icon">💳</div>
        <div>
          <div className="form-card-title">Add Transaction</div>
          <div className="form-card-subtitle">Charges & profit auto-calculated</div>
        </div>
      </div>

      <div className="form-card-body">
        {submitted && <div className="alert alert-success" role="alert">Transaction added successfully.</div>}
        {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-date">Transaction Date <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-prefix">📅</span>
                <input
                  id="txn-date"
                  type="date"
                  name="date"
                  className={`form-control has-prefix${errors.date ? ' error' : ''}`}
                  value={form.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-portal">Portal Name <span className="required">*</span></label>
              <select
                id="txn-portal"
                name="portal"
                className={`form-control${errors.portal ? ' error' : ''}`}
                value={form.portal}
                onChange={handleChange}
              >
                <option value="">Select Portal</option>
                {portals.length > 0 ? portals.map((p) => (
                  <option key={p.id} value={p.portal_name}>{p.portal_name}</option>
                )) : <option disabled>Loading portals...</option>}
              </select>
              {errors.portal && <span className="form-error">{errors.portal}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-type">Transaction Type <span className="required">*</span></label>
              <select
                id="txn-type"
                name="transaction_type"
                className={`form-control${errors.transaction_type ? ' error' : ''}`}
                value={form.transaction_type}
                onChange={handleChange}
              >
                <option value="CC Withdrawal">CC Withdrawal</option>
                <option value="CC Bill Payment">CC Bill Payment</option>
              </select>
              {errors.transaction_type && <span className="form-error">{errors.transaction_type}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-card-digit">Card Digit <span className="required">*</span></label>
              <input
                id="txn-card-digit"
                type="text"
                name="card_digit"
                className={`form-control${errors.card_digit ? ' error' : ''}`}
                value={form.card_digit}
                onChange={handleChange}
                placeholder="Last 4 digits"
                maxLength="4"
                inputMode="numeric"
              />
              {errors.card_digit && <span className="form-error">{errors.card_digit}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-customer-name">Customer Name <span className="required">*</span></label>
              <input
                id="txn-customer-name"
                type="text"
                name="customer_name"
                className={`form-control${errors.customer_name ? ' error' : ''}`}
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
              />
              {errors.customer_name && <span className="form-error">{errors.customer_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-mobile-number">Mobile Number <span className="required">*</span></label>
              <input
                id="txn-mobile-number"
                type="tel"
                name="mobile_number"
                className={`form-control${errors.mobile_number ? ' error' : ''}`}
                value={form.mobile_number}
                onChange={handleChange}
                placeholder="10 to 15 digits"
                maxLength="15"
                inputMode="numeric"
              />
              {errors.mobile_number && <span className="form-error">{errors.mobile_number}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-bank-account">Bank Account <span className="required">*</span></label>
              <input
                id="txn-bank-account"
                type="text"
                name="bank_account"
                className={`form-control${errors.bank_account ? ' error' : ''}`}
                value={form.bank_account}
                onChange={handleChange}
                placeholder="Enter bank account"
              />
              {errors.bank_account && <span className="form-error">{errors.bank_account}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-bill-pay-charges">Bill Pay Charges {(form.transaction_type === 'CC Bill Payment' || form.transaction_type === 'CC Withdrawal') && (
                <span className="required">*</span>
              )}</label>
              <div className="input-wrapper">
                <span className="input-prefix" style={{ fontWeight: 700, color: 'var(--olive)' }}>₹</span>
                <input
                  id="txn-bill-pay-charges"
                  type="text"
                  name="bill_pay_charges"
                  className={`form-control has-prefix${errors.bill_pay_charges ? ' error' : ''}`}
                  value={form.bill_pay_charges || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  inputMode="decimal"
                  style={{ WebkitTextSecurity: 'none', letterSpacing: 'normal' }}
                  disabled={
                    !(form.transaction_type === 'CC Bill Payment' ||
                      form.transaction_type === 'CC Withdrawal')
                  }
                />
              </div>
              <span className="form-hint">
                {(form.transaction_type === 'CC Bill Payment' || form.transaction_type === 'CC Withdrawal')
                  ? 'Enter extra charges if applicable'
                  : ''}
              </span>
              {errors.bill_pay_charges && <span className="form-error">{errors.bill_pay_charges}</span>}
            </div>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label className="form-label" htmlFor="txn-amount">Transaction Amount <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-prefix" style={{ fontWeight: 700, color: 'var(--olive)' }}>₹</span>
                <input
                  id="txn-amount"
                  type="text"
                  name="amount"
                  className={`form-control has-prefix${errors.amount ? ' error' : ''}`}
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                />
              </div>
              <span className="form-hint">Enter the credit card swipe amount in ₹</span>
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>
          </div>

          {Number(form.amount) > 0 && (
            <div className="calc-panel">
              <div className="calc-panel-title"><span>⚡</span> Auto-Calculated Breakdown</div>
              <div className="calc-grid">
                <div className="calc-item">
                  <div className="calc-val olive">{fmtINR(calc.charges)}</div>
                  <div className="calc-key">Our Charges</div>
                  <div className="calc-formula">Amount × {ourRateLabel}%</div>
                </div>
                <div className="calc-item">
                  <div className="calc-val red">{fmtINR(calc.portal_charges)}</div>
                  <div className="calc-key">Portal Charges</div>
                </div>
                <div className="calc-item">
                  <div className="calc-val red">{fmtINR(calc.bill_pay_charges)}</div>
                  <div className="calc-key">Bill Pay Charges</div>
                </div>
                <div className="calc-item" style={{ borderColor: 'rgba(31,140,90,0.3)' }}>
                  <div className="calc-val green">{fmtINR(calc.profit)}</div>
                  <div className="calc-key">Net Profit</div>
                  <div className="calc-formula">Charges - Portal - Bill Pay</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset} disabled={loading}>Reset</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Transaction'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionForm;
