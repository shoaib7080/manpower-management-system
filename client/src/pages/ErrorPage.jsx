import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

const btnPrimary =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md bg-primary-container text-on-primary font-semibold hover:bg-primary";
const btnOutline =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-label-sm border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low";
const btnPrimarySm =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-label-sm bg-primary-container text-on-primary font-semibold hover:bg-primary";

// Full-page error — shown when the layout itself crashes
export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Something went wrong';

  const message = isRouteErrorResponse(error)
    ? error.data
    : error?.message || 'An unexpected error occurred.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg py-9 px-10 max-w-[480px] w-full shadow-[0_8px_24px_-8px_rgba(20,32,43,0.2)] text-center">
        <div className="w-12 h-12 rounded-[9999px] bg-error-container/40 flex items-center justify-center mx-auto mb-4 text-[22px]">
          ⚠
        </div>
        <h2 className="text-headline-sm uppercase text-on-background mb-2">
          {title}
        </h2>
        <p className="text-body-sm text-on-surface-variant mb-6 leading-relaxed">
          {message}
        </p>
        <button className={btnPrimary} onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// Inline error — shown when a page crashes but the sidebar stays visible
export function PageErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.data}`
    : error?.message || 'This page encountered an unexpected error.';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="w-11 h-11 rounded-[9999px] bg-error-container/40 flex items-center justify-center text-xl">
        ⚠
      </div>
      <div className="text-center">
        <h3 className="text-body-lg font-semibold uppercase text-on-background mb-1.5">
          Page Error
        </h3>
        <p className="text-body-sm text-on-surface-variant max-w-[360px] leading-relaxed">
          {message}
        </p>
      </div>
      <div className="flex gap-2">
        <button className={btnOutline} onClick={() => navigate(0)}>↺ Retry</button>
        <button className={btnPrimarySm} onClick={() => navigate('/')}>← Dashboard</button>
      </div>
    </div>
  );
}
