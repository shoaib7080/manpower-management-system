import { useQueryClient } from '@tanstack/react-query';
import useDashboardStore from '../../store/useDashboardStore';
import ComplianceDot from '../ComplianceDot';

function getComplianceLevel(trainings) {
  if (!trainings) return 'gray';
  const now = new Date();
  const soon = new Date(); soon.setDate(now.getDate() + 30);
  const fields = ['adnocInductionExpiry', 'h2sExpiry', 'medicalExpiry', 'seaSurvivalExpiry'];
  const dates = fields.map((f) => trainings[f] ? new Date(trainings[f]) : null);
  if (dates.some((d) => !d)) return 'gray';
  if (dates.some((d) => d < now)) return 'red';
  if (dates.some((d) => d < soon)) return 'yellow';
  return 'green';
}

export default function SuggestDrawer() {
  const { open, joId, slotIdx } = useDashboardStore((s) => s.ui.drawer);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);

  const qc = useQueryClient();
  const jobOrders = qc.getQueryData(['jobOrders']) || [];
  const jo = open ? jobOrders.find((j) => j._id === joId) : null;
  const slot = jo ? jo.slots[slotIdx] : null;

  const allEmployees = qc.getQueryData(['employees', '', '', '', ''])?.employees || [];
  const candidates = slot
    ? allEmployees.filter(
        (e) => e.trade === slot.trade && e.status === 'AVAILABLE' && getComplianceLevel(e.trainings) === 'green'
      )
    : [];

  return (
    <>
      <div className={`drawer-overlay${open ? ' show' : ''}`} onClick={closeDrawer} />
      <div className={`drawer${open ? ' show' : ''}`}>
        {slot && (
          <>
            <div className="drawer-head">
              <h3>Suggested {slot.trade}s</h3>
              <div className="sub">{jo.jobOrderNumber} · {slot.trade} Slot {slot.slotNumber} · valid clearances only</div>
            </div>
            <div className="drawer-body">
              {candidates.length === 0 ? (
                <div className="empty-state">No fully-compliant {slot.trade.toLowerCase()}s are currently available.</div>
              ) : (
                candidates.map((c) => (
                  <div className="cand-card" key={c._id}>
                    <div>
                      <div className="cand-name">{c.name}</div>
                      <div className="cand-meta mono">{c.employeeId} · {c.emiratesId || c.passportNumber}</div>
                      <div className="cand-check">
                        {['adnocInductionExpiry', 'h2sExpiry', 'medicalExpiry', 'seaSurvivalExpiry'].map((f) => (
                          <ComplianceDot key={f} level={getComplianceLevel({ [f]: c.trainings?.[f] })} />
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openAssignAudit(joId, slotId, c)}>
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
