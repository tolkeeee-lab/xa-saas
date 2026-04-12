        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2340' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f' }} />
            <span style={{ color: '#00d68f', fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
          <div style={{ color: '#7a85a0', fontSize: 11, fontFamily: 'monospace', marginBottom: 10 }}>{clock}</div>
          <a
            href="/dashboard"
            style={{
              display: 'block', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(155,114,255,0.1)', border: '1px solid rgba(155,114,255,0.3)',
              color: '#9b72ff', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', textAlign: 'center',
            }}
          >← Mon tableau de bord</a>
        </div>
