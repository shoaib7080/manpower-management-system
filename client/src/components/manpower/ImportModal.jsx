import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { uploadExcel } from '../../api/services';

const REQUIRED_COLS = [
  { col: 'Employee ID', alt: 'EMP_ID  or  EmployeeNo', req: true, note: 'Unique identifier — used for upsert' },
  { col: 'Full Name', alt: 'Name  or  Employee Name', req: true, note: '' },
  { col: 'Trade', alt: 'Designation', req: false, note: 'Supervisor / Fabricator / Welder / Fitter / Rigger / Helper / Other' },
];

const OPTIONAL_COLS = [
  { col: 'DOB', alt: 'Date of Birth', note: 'DD/MM/YYYY or Excel date serial' },
  { col: 'Emirates ID', alt: '', note: 'UAE residents — 784-XXXX-XXXXXXX-X' },
  { col: 'Passport Number', alt: '', note: 'Non-UAE residents' },
  { col: 'ADNOC Induction Expiry', alt: '', note: 'Date format' },
  { col: 'H2S Training Expiry', alt: 'H2S Expiry', note: 'Date format' },
  { col: 'Medical Expiry', alt: '', note: 'Date format' },
  { col: 'Sea Survival Expiry', alt: '', note: 'Date format — offshore only' },
];

const th = {
  textAlign: 'left', padding: '7px 10px', fontSize: 10.5, fontWeight: 600,
  color: 'var(--text-2)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap',
};
const td = {
  padding: '7px 10px', borderBottom: '1px solid var(--line)', verticalAlign: 'top', lineHeight: 1.5,
};

function ColTable({ rows, required }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: 'var(--paper)' }}>
          <th style={th}>Column Header</th>
          <th style={th}>Accepted Alternatives</th>
          <th style={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.col}>
            <td style={td}>
              <span className="mono" style={{ fontSize: 11 }}>{r.col}</span>
              {required && r.req && (
                <span style={{ color: 'var(--red)', marginLeft: 4, fontSize: 10 }}>*</span>
              )}
            </td>
            <td style={{ ...td, color: 'var(--text-2)' }}>
              {r.alt ? <span className="mono" style={{ fontSize: 10.5 }}>{r.alt}</span> : '—'}
            </td>
            <td style={{ ...td, color: 'var(--text-2)' }}>{r.note || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ImportModal({ onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: (fd) => uploadExcel(fd),
    onSuccess: (res) => {
      qc.invalidateQueries(['employees']);
      setResult({
        ok: true,
        message: res.data.message,
        processed: res.data.processedCount,
        skipped: res.data.skippedCount,
      });
    },
    onError: (err) => {
      setResult({
        ok: false,
        message: err.response?.data?.message || 'Upload failed. Please check the file and try again.',
      });
    },
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    mutation.mutate(fd);
    e.target.value = '';
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 580 }}>

        <div className="modal-head">
          <h3>Import Excel Data</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>

          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
            Your file must use the <b>first sheet</b> with column headers exactly as listed below.
            Column order does not matter. Existing records are matched and updated by{' '}
            <span className="mono" style={{ fontSize: 11 }}>Employee ID</span> (upsert).
          </p>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7, letterSpacing: '.03em' }}>
              REQUIRED COLUMNS
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <ColTable rows={REQUIRED_COLS} required />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7, letterSpacing: '.03em' }}>
              OPTIONAL COLUMNS
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <ColTable rows={OPTIONAL_COLS} />
            </div>
          </div>

          <div style={{
            background: 'var(--yellow-bg)', borderLeft: '3px solid var(--yellow)',
            borderRadius: 'var(--radius)', padding: '10px 12px',
            fontSize: 11.5, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 4,
          }}>
            <b>Dates:</b> use <span className="mono" style={{ fontSize: 11 }}>DD/MM/YYYY</span> or leave as an Excel date cell.
            All imported employees default to <b>AVAILABLE</b> status.
            Rows missing both Employee ID and Full Name are skipped automatically.
          </div>

          {result && (
            <div style={{
              marginTop: 14, padding: '10px 13px', borderRadius: 'var(--radius)', fontSize: 12,
              background: result.ok ? 'var(--green-bg)' : 'var(--red-bg)',
              borderLeft: `3px solid ${result.ok ? 'var(--green)' : 'var(--red)'}`,
              color: result.ok ? 'var(--green)' : 'var(--red)',
            }}>
              {result.ok ? (
                <>
                  <b>Import successful.</b>{' '}
                  {result.processed} record{result.processed !== 1 ? 's' : ''} processed
                  {result.skipped > 0 && `, ${result.skipped} row${result.skipped !== 1 ? 's' : ''} skipped (missing required fields)`}.
                </>
              ) : (
                <><b>Error:</b> {result.message}</>
              )}
            </div>
          )}
        </div>

        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {mutation.isPending ? 'Uploading…' : '↑ Choose File & Upload'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>

      </div>
    </div>
  );
}
