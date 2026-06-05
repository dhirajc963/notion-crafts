import React from 'react';
import { Widget, WIDGETS } from './NotionCrafts.jsx';

const SIZES = [['M', 232, 1], ['S', 196, 0.82]];
const FRAME_W = 460;

export default function AuditView() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {WIDGETS.map(w =>
        SIZES.map(([sl, h, sc]) => (
          <div key={w.id + sl} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 150, fontSize: 12, fontFamily: 'monospace', color: '#444', paddingTop: 4 }}>
              {w.name}<br /><span style={{ color: '#999' }}>{w.type} · {sl}</span>
            </div>
            <div className="audit-frame" data-id={w.id} data-name={w.name} data-type={w.type} data-size={sl} data-h={h}
              style={{ width: FRAME_W, height: h, overflow: 'hidden', borderRadius: 12, boxShadow: '0 0 0 1px #e6e6e6' }}>
              <Widget type={w.type} config={w.config || {}} accent={'#E0603A'}
                fontStack={"'Hanken Grotesk', system-ui, sans-serif"} sizeScale={sc} theme="light" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
