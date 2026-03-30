import React, { useState } from 'react';
import { Building, ChevronRight, AlertCircle, Info } from 'lucide-react';

const CompanyInputForm = ({ onSubmit, error }) => {
  const [companyName, setCompanyName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ companyName, additionalContext });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 2rem 4rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <Building style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#6366f1' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Let's Build Your Stakeholder Strategy
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          Start by telling us about your organization
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Company/Organization Name *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Acme Corporation"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${focusedField === 'companyName' ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: '0.5rem',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={() => setFocusedField('companyName')}
            onBlur={() => setFocusedField(null)}
            autoComplete="off"
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            fontSize: '0.875rem'
          }}>
            Additional Context (Optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any specific information about your organization, recent events, or strategic priorities..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${focusedField === 'context' ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              resize: 'vertical',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={() => setFocusedField('context')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!companyName.trim()}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: companyName.trim() ? '#6366f1' : '#e5e7eb',
            color: companyName.trim() ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: companyName.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (companyName.trim()) {
              e.target.style.background = '#4f46e5';
            }
          }}
          onMouseLeave={(e) => {
            if (companyName.trim()) {
              e.target.style.background = '#6366f1';
            }
          }}
        >
          Begin Analysis
          <ChevronRight style={{ width: '20px', height: '20px' }} />
        </button>
      </form>

      <div style={{
        marginTop: '3rem',
        padding: '1rem',
        background: '#f3f4f6',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#4b5563'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <Info style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>What happens next?</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              We'll analyze your organization using multiple data sources to understand your 
              industry position, stakeholder landscape, and strategic context. This helps us 
              provide intelligent recommendations tailored to your specific situation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInputForm;