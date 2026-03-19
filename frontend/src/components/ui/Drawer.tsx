import { type ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Drawer({ isOpen, title, subtitle, onClose, children }: DrawerProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close drawer" />
      <section className="drawer-panel">
        <header className="drawer-header">
          <div>
            <p className="drawer-kicker">Workflow Panel</p>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="drawer-content">
          <div className="drawer-content-inner">{children}</div>
        </div>
      </section>
    </div>
  );
}
