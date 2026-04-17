import React, { useState, useEffect } from 'react';

const INITIAL = { portal_name: '', company_name: '', charge_per_transaction: '' };

const PortalForm = ({ initialData, onSubmit, onCancel }) => {
  const [form,    setForm]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  /* Pre-fill on edit */
  useEffect(() => {
    if (initialData) {
      setForm({
        portal_name:           initialData.portal_name           || '',
        company_name:          initialData.company_name          || '',
        charge_per_transaction: String(initialData.charge_per_transaction || ''),
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
    setSuccess('');
    setApiError('');
  }, [initialData]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.portal_name.trim())
      errs.portal_name = 'Portal name is required';
    if (!form.company_name.trim())
      errs.company_name = 'Company name is required';
    if (form.charge_per_transaction === '' || form.charge_per_transaction === null)
      errs.charge_per_transaction = 'Charge is required';
    else if (isNaN(Number(form.charge_per_transaction)) || Number(form.charge_per_transaction) < 0)
      errs.charge_per_transaction = 'Enter a valid non-negative number';
    else if (Number(form.charge_per_transaction) > 100)
      errs.charge_per_transaction = 'Charge cannot exceed 100%';
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    setSuccess('');

    try {
      await onSubmit({
        portal_name:           form.portal_name.trim(),
        company_name:          form.company_name.trim(),
        charge_per_transaction: Number(form.charge_per_transaction),
      });
      setSuccess(initialData ? 'Portal updated successfully!' : 'Portal created successfully!');
      if (!initialData) setForm(INITIAL);
    } catch (err) {
      setApiError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setApiError('');
  };

  const fields = [
    {
      id:    'portal_name',
      key:   'portal_name',
      label: 'Portal Name',
      type:  'text',
      ph:    'e.g. PhonePe, Paytm, Razorpay',
      icon:  '🌐',
    },
    {
      id:    'company_name',
      key:   'company_name',
      label: 'Company Name',
      type:  'text',
      ph:    'e.g. PhonePe Pvt Ltd',
      icon:  '🏢',
    },
    {
      id:    'charge_per_transaction',
      key:   'charge_per_transaction',
      label: 'Charges per Transaction (%)',
      type:  'number',
      ph:    'e.g. 1.8',
      icon:  '💸',
      step:  '0.01',
      min:   '0',
      max:   '100',
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="portal-form">
      {success  && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}
      {apiError && <div className="alert alert-danger"  style={{ marginBottom: 16 }}>⚠️ {apiError}</div>}

      {fields.map(f => (
        <div className="form-group portal-form-group" key={f.key}>
          <label className="form-label" htmlFor={f.id}>
            <span className="form-label-icon">{f.icon}</span>
            {f.label}
            <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
          </label>
          <input
            id={f.id}
            type={f.type}
            step={f.step}
            min={f.min}
            max={f.max}
            className={`form-control${errors[f.key] ? ' error' : ''}`}
            value={form[f.key]}
            onChange={e => handleChange(f.key, e.target.value)}
            placeholder={f.ph}
            disabled={loading}
          />
          {errors[f.key] && (
            <span className="form-error">⚠ {errors[f.key]}</span>
          )}
        </div>
      ))}

      {/* Helper note */}
      <div className="portal-form-note">
        <span>💡</span>
        <span>Charges are entered as a percentage of each transaction (e.g. enter <strong>1.8</strong> for 1.8%).</span>
      </div>

      <div className="modal-footer" style={{ padding: 0, paddingTop: 18 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={loading}
        >
          {loading
            ? (initialData ? 'Updating…' : 'Creating…')
            : (initialData ? '✏️ Update Portal' : '➕ Create Portal')
          }
        </button>
      </div>
    </form>
  );
};

export default PortalForm;