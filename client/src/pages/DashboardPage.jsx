import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchEmployees, fetchJobOrders } from "../api/services";
import { getLevel } from "../components/manpower/employeeUtils";

const daysUntil = (d) =>
  Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await fetchEmployees({})).data,
  });
  const { data: jobOrders = [], isLoading: joLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => (await fetchJobOrders()).data,
  });

  const summary = empData?.summary || {};
  const employees = empData?.employees || [];

  const utilization =
    summary.total > 0
      ? Math.round(((summary.mobilized || 0) / summary.total) * 100)
      : 0;

  // "Critical" here means a real, checkable thing: unfilled slots on job
  // orders starting within the next 14 days — not an arbitrary invented
  // status. Job orders with no near-term start date don't count, even if
  // they have open slots, since there's no real urgency yet.
  const criticalGaps = jobOrders.reduce((sum, jo) => {
    const daysToStart = jo.startDate ? daysUntil(jo.startDate) : 999;
    if (daysToStart > 14) return sum;
    return sum + jo.slots.filter((s) => s.status === "UNASSIGNED").length;
  }, 0);

  // Compliance alerts: expired trainings (from the backend summary) plus
  // any employee whose HSE Passport or CICPA Pass is expired or expiring
  // within 30 days (computed the same way the Directory's compliance dots
  // are computed, so the number on this card always matches what a
  // coordinator would find if they went and looked).
  const docAlerts = employees.filter((e) => {
    const hse = e.documents?.hsePassport;
    const cicpa = e.documents?.cicpaPass;
    const hseLevel = hse?.expiry ? getLevel(hse.expiry) : "gray";
    const cicpaLevel = cicpa?.expiry ? getLevel(cicpa.expiry) : "gray";
    return (
      hseLevel === "red" ||
      hseLevel === "yellow" ||
      cicpaLevel === "red" ||
      cicpaLevel === "yellow"
    );
  }).length;
  const complianceAlerts = (summary.expiredTrainings || 0) + docAlerts;

  const activeSites = jobOrders
    .map((jo) => {
      const total = jo.slots.length;
      const filled = jo.slots.filter((s) => s.status !== "UNASSIGNED").length;
      return { jo, total, filled, shortfall: total - filled };
    })
    .filter((s) => s.shortfall > 0)
    .sort((a, b) => b.shortfall - a.shortfall)
    .slice(0, 4);

  const upcomingDemob = employees
    .filter(
      (e) =>
        (e.status === "MOBILIZED" || e.status === "BOOKED") &&
        e.currentAssignment?.targetDemobDate &&
        daysUntil(e.currentAssignment.targetDemobDate) <= 90 &&
        daysUntil(e.currentAssignment.targetDemobDate) >= 0,
    )
    .sort(
      (a, b) =>
        new Date(a.currentAssignment.targetDemobDate) -
        new Date(b.currentAssignment.targetDemobDate),
    )
    .slice(0, 6);

  const loading = empLoading || joLoading;

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Operations Overview
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Real-time manpower allocation and site fulfillment metrics.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-outline text-body-sm py-8">
          Loading overview…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Total Headcount
              </div>
              <div className="text-headline-lg text-on-surface font-mono-data">
                {summary.total ?? 0}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Deployment Utilization
              </div>
              <div className="text-headline-lg text-on-surface font-mono-data">
                {utilization}%
              </div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">
                / {summary.mobilized ?? 0} Mobilized
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
              <div className="text-label-sm uppercase text-orange-600 mb-1.5">
                Critical Gaps (14d)
              </div>
              <div className="text-headline-lg text-orange-600 font-mono-data">
                {criticalGaps}
              </div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">
                open slots
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
              <div className="text-label-sm uppercase text-error mb-1.5">
                Compliance Alerts
              </div>
              <div className="text-headline-lg text-error font-mono-data">
                {complianceAlerts}
              </div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">
                certs expired / expiring
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-headline-sm text-on-surface">
                  Active Site Fulfillment
                </h3>
                <button
                  onClick={() => navigate("/job-orders")}
                  className="text-label-sm text-primary-container font-semibold hover:underline"
                >
                  View All Sites
                </button>
              </div>

              {activeSites.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg text-center text-outline text-body-sm py-8">
                  No job orders with open slots — everything is fulfilled.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSites.map(({ jo, total, filled, shortfall }) => (
                    <div
                      key={jo._id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-body-lg font-semibold text-on-surface">
                          {jo.siteName}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            shortfall > total / 2
                              ? "bg-error-container text-on-error-container"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {shortfall > total / 2 ? "CRITICAL" : "IN PROGRESS"}
                        </span>
                      </div>
                      <div className="font-mono-data text-[11px] text-on-surface-variant mb-3">
                        {jo.clientCategory}
                      </div>
                      <div className="flex justify-between text-label-md mb-1">
                        <span className="text-on-surface">Fulfillment</span>
                        <span className="text-on-surface-variant">
                          {filled}/{total}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-3">
                        <div
                          className="bg-primary-container h-1.5 rounded-full"
                          style={{
                            width: `${total > 0 ? (filled / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <button
                        className="w-full border border-outline-variant rounded px-3 py-1.5 text-label-sm text-on-surface hover:bg-surface-container-low"
                        onClick={() => navigate("/job-orders")}
                      >
                        Manage Slots
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-headline-sm text-on-surface mb-3">
                Upcoming Demob (90d)
              </h3>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                {upcomingDemob.length === 0 ? (
                  <div className="text-center text-outline text-body-sm py-6 px-3">
                    No mobilized workers demobilizing in the next 90 days.
                  </div>
                ) : (
                  upcomingDemob.map((e) => {
                    const d = daysUntil(e.currentAssignment.targetDemobDate);
                    return (
                      <div
                        key={e._id}
                        className="flex justify-between items-center px-3.5 py-2.5 border-b border-outline-variant last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="text-body-sm font-semibold text-on-surface truncate">
                            {e.name}{" "}
                            <span className="font-mono-data text-[10px] text-on-surface-variant">
                              ({e.employeeId})
                            </span>
                          </div>
                          <div className="text-label-sm text-on-surface-variant truncate">
                            {e.currentAssignment.siteName}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                            d <= 7
                              ? "bg-error-container text-on-error-container"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {d} Day{d !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })
                )}
                {upcomingDemob.length > 0 && (
                  <button
                    onClick={() => navigate("/directory")}
                    className="w-full text-center py-2.5 text-label-sm text-primary-container font-semibold hover:bg-surface-container-low border-t border-outline-variant"
                  >
                    View All Demobilizations
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
