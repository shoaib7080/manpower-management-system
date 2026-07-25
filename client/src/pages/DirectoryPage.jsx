import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchEmployees } from '../api/services';
import ComplianceDot from '../components/ComplianceDot';
import StatusBadge from '../components/StatusBadge';
import ImportModal from '../components/manpower/ImportModal';

const STATUS_TABS = [
  ['', 'All Statuses'],
  ['AVAILABLE', 'Available'],
  ['RESERVED', 'Reserved'],
  ['BOOKED', 'Booked'],
  ['MOBILIZED', 'Mobilized'],
  ['VACATION', 'Vacation / Halted'],
];

const TRADES = ['Supervisor', 'Foreman', 'Fabricator', 'Welder', 'Fitter', 'Rigger', 'Helper', 'Other'];

function getLevel(date) {
  if (!date) return 'gray';
  const now = new Date();
  const d = new Date(date);
  if (d < now) return 'red';
  const soon = new Date(); soon.setDate(now.getDate() + 30);
  if (d < soon) return 'yellow';
  return 'green';
}

export default function DirectoryPage() {
  const [status, setStatus] = useState('');
  const [compliance, setCompliance] = useState('');
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, trades.join(','), status, compliance],
    queryFn: async () => {
      const res = await fetchEmployees({ search, trade: trades.join(','), status, compliance });
      return res.data;
    },
  });

  const employees = data?.employees || [];
  const summary = data?.summary || {};

  const toggleTrade = (tr) =>
    setTrades((prev) => prev.includes(tr) ? prev.filter((t) => t !== tr) : [...prev, tr]);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Master Personnel Directory</h1>
          <div className="sub">Single source of truth for every tradesman — status, trade & ADNOC clearance at a glance.</div>
        </div>
        <div className="btn-row">
           <button className="btn btn-outline" onClick={() => setImportOpen(true)}>
            ↑ Import Excel Data
          </button>
           <button className="btn btn-primary">+ Add New Employee</button>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-card sc-red">
          <div><div className="num">{summary.expiredTrainings ?? 0}</div><div className="lbl">Expired Certs</div></div>
          
        </div>
        <div className="summary-card sc-red">
          <div><div className="num">{(summary.total ?? 0) - (summary.available ?? 0) - (summary.booked ?? 0) - (summary.mobilized ?? 0) - (summary.reserved ?? 0)}</div><div className="lbl">Vacation / Halted</div></div>
         
        </div>
        <div className="summary-card sc-yellow">
          <div><div className="num">{summary.reserved ?? 0}</div><div className="lbl">Reserved</div></div>
          
        </div>
        <div className="summary-card sc-teal">
          <div><div className="num">{summary.total ?? 0}</div><div className="lbl">Total Workforce</div></div>
         
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <span className="filter-label">Status</span>
          {STATUS_TABS.map(([val, label]) => (
            <button key={val} className={`tab-pill${status === val ? ' active' : ''}`} onClick={() => setStatus(val)}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">Compliance</span>
          <select className="ff" value={compliance} onChange={(e) => setCompliance(e.target.value)}>
            <option value="">All Compliance</option>
            <option value="INCOMPLETE">Not Ready / Incomplete</option>
            <option value="EXPIRED">Expired</option>
            <option value="EXPIRING_SOON">Expiring in 30 Days</option>
            <option value="READY">Compliant / Ready</option>
          </select>
          <span className="filter-label" style={{ marginLeft: 8 }}>Trade</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TRADES.map((tr) => (
              <button key={tr} className={`chip${trades.includes(tr) ? ' active' : ''}`} onClick={() => toggleTrade(tr)}>
                {tr}
              </button>
            ))}
          </div>
          <input className="ff" style={{ marginLeft: 'auto' }} type="text"
            placeholder="Search name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="empty-state">Loading personnel registry…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name & Trade</th>
                <th>Emirates ID / Passport</th>
                <th>Status</th>
                <th>Induction</th>
                <th>H2S</th>
                <th>Sea Surv.</th>
                <th>Medical</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id}>
                  <td className="mono">{e.employeeId}</td>
                  <td>
                    <div className="emp-name">{e.name}</div>
                    <div className="emp-trade">{e.trade}</div>
                  </td>
                  <td className="mono">{e.emiratesId || e.passportNumber || '—'}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td><ComplianceDot level={getLevel(e.trainings?.adnocInductionExpiry)} /></td>
                  <td><ComplianceDot level={getLevel(e.trainings?.h2sExpiry)} /></td>
                  <td><ComplianceDot level={getLevel(e.trainings?.seaSurvivalExpiry)} /></td>
                  <td><ComplianceDot level={getLevel(e.trainings?.medicalExpiry)} /></td>
                  <td><button className="icon-btn" title="View profile">
                    View
                  </button>
                  <button className="icon-btn" title="Reassign">
                    Reassign
                  </button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && employees.length === 0 && (
          <div className="empty-state">No personnel match the current filters.</div>
        )}
      </div>
       {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}
