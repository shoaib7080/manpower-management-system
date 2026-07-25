import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--paper, #EEF1F2)', padding: 24,
    }}>
      <div style={{
        background: '#fff', border: '1px solid var(--line, #DCE2E4)', borderRadius: 8,
        padding: '36px 40px', maxWidth: 480, width: '100%',
        boxShadow: '0 8px 24px -8px rgba(20,32,43,0.2)', textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--red-bg, #FBE7E7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 22,
        }}>⚠</div>
        <h2 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', fontSize: 18, marginBottom: 8 }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--steel-500, #4A6373)', marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 400, gap: 16, padding: 32,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', background: 'var(--red-bg, #FBE7E7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>⚠</div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', fontSize: 15, marginBottom: 6 }}>
          Page Error
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--steel-500, #4A6373)', maxWidth: 360, lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(0)}>↺ Retry</button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>← Dashboard</button>
      </div>
    </div>
  );
}
