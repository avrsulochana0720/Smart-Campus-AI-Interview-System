import React from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Plus } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const { showToast } = useToast();

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage and configure your {title.toLowerCase()} settings and data.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => showToast('This feature is coming soon.', 'info')} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            backgroundColor: '#334155', color: '#0F172A', 
            border: '1px solid #475569', borderRadius: '0.5rem', 
            padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
          >
            <Filter size={16} />
            Filters
          </button>
          <button onClick={() => showToast('This feature is coming soon.', 'info')} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            backgroundColor: '#E11D48', color: '#FFFFFF', 
            border: 'none', borderRadius: '0.5rem', 
            padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#BE123C'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E11D48'}
          >
            <Plus size={16} />
            New {title.split(' ')[0]}
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#FAF6EE', border: '1px dashed #334155', borderRadius: '1rem', 
        height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center'
      }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(225, 29, 72, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' 
        }}>
          <Search size={32} color="#E11D48" />
        </div>
        <h3 style={{ fontSize: '1.2rem', color: '#0F172A', fontWeight: 600, margin: '0 0 0.5rem 0' }}>No Data Available Yet</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '400px', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
          The {title} module is currently empty or being initialized. Check back later or start adding new records to see them appear here.
        </p>
        <button onClick={() => showToast('This feature is coming soon.', 'info')} style={{ 
            backgroundColor: '#334155', color: '#0F172A', 
            border: '1px solid #475569', borderRadius: '0.5rem', 
            padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
        >
          Initialize Module
        </button>
      </div>
    </div>
  );
}
