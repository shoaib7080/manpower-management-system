// Shared modal shell — every dialog in the app composes these instead of
// each redefining the same overlay/header/body/footer markup. Still pure
// Tailwind utilities under the hood; this just avoids repeating the same
// long className strings across ~8 modal components. See Design.md §2/§4.

export function Overlay({ children, onBackdropClick }) {
  return (
    <div
      className="fixed inset-0 bg-on-background/45 flex items-center justify-center z-50 p-5"
      onClick={
        onBackdropClick
          ? (e) => e.target === e.currentTarget && onBackdropClick()
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function ModalShell({ children, width = 520 }) {
  return (
    <div
      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.08)] max-w-full"
      style={{ width }}
    >
      {children}
    </div>
  );
}

export function ModalHead({ title, onClose }) {
  return (
    <div className="px-[18px] py-3.5 border-b border-outline-variant flex justify-between items-start">
      <h3 className="text-body-lg font-semibold text-on-surface">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        className="text-on-surface-variant text-base leading-none p-0.5 hover:text-on-surface"
      >
        ✕
      </button>
    </div>
  );
}

export function ModalBody({ children }) {
  return <div className="px-[18px] py-4">{children}</div>;
}

export function ModalFoot({ children }) {
  return (
    <div className="px-[18px] py-3 border-t border-outline-variant flex justify-end gap-2 bg-surface-container-low">
      {children}
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
        {label} {required && <span className="text-error">*</span>}
        {hint && (
          <span className="text-outline font-normal normal-case"> {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

export function WarnBox({ label = "Error", children }) {
  return (
    <div className="bg-error-container/40 border-l-[3px] border-error rounded px-3.5 py-2.5 mb-3.5">
      <div className="text-label-sm font-bold uppercase text-error mb-1">
        {label}
      </div>
      <p className="text-body-sm text-on-error-container m-0 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export const inputCls =
  "w-full border border-outline-variant rounded px-2.5 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/15";

export const btnOutline =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low";
export const btnPrimary =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md bg-primary-container text-on-primary font-semibold hover:bg-primary disabled:bg-outline-variant disabled:text-outline disabled:cursor-not-allowed";
export const iconBtn =
  "px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface-variant hover:bg-surface-container-low";
export const btnGhost =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md border border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-low";
export const btnDangerOutline =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md border border-error text-error bg-surface-container-lowest hover:bg-error-container/20 disabled:border-outline-variant disabled:text-outline disabled:cursor-not-allowed disabled:hover:bg-surface-container-lowest";
