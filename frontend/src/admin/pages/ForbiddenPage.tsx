import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ForbiddenPageProps {
  title: string;
}

export default function ForbiddenPage({ title }: ForbiddenPageProps) {
  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Access Denied</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Unauthorized access attempts are logged and monitored.</p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '1rem', 
        height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center', boxShadow: '6px 6px 0px #0F172A'
      }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(225, 29, 72, 0.1)', 
          border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' 
        }}>
          <ShieldAlert size={32} color="#E11D48" />
        </div>
        <h3 style={{ fontSize: '1.4rem', color: '#0F172A', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Forbidden Content</h3>
        <p style={{ color: '#1E293B', fontSize: '0.9rem', maxWidth: '450px', margin: '0 0 2rem 0', fontWeight: 600, lineHeight: 1.5 }}>
          Your current account role (TPO) does not have administrative clearance to access the "{title}" system module. 
          Please contact a Super Admin if you believe this is in error.
        </p>
      </div>
    </div>
  );
}
