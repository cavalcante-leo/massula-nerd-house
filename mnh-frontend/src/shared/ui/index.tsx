import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';

/* ===================== Toasts ===================== */
type ToastType = 'success' | 'error';
type PushToast = (message: string, type?: ToastType) => void;

const ToastCtx = createContext<PushToast>(() => {});
export const useToast = () => useContext(ToastCtx);

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback<PushToast>((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ===================== Modal ===================== */
interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, title, onClose, children, footer, maxWidth }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ===================== Confirm dialog ===================== */
interface ConfirmProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="banner warn" style={{ margin: 0 }}>
        {message}
      </div>
    </Modal>
  );
}

/* ===================== Misc ===================== */
export function Spinner() {
  return <div className="spinner" />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="big">{title}</div>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function RankPill({ patente }: { patente?: number | null }) {
  const p = Math.min(6, Math.max(1, patente ?? 1));
  return <span className={`rank-pill rank-${p}`}>P{p}</span>;
}

export function Pill({
  tone = 'grey',
  children,
}: {
  tone?: 'green' | 'gold' | 'red' | 'grey' | 'felt' | 'gold-solid' | 'wood';
  children: ReactNode;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function StatusPill({ ativo }: { ativo: boolean }) {
  return <Pill tone={ativo ? 'green' : 'grey'}>{ativo ? 'Ativo' : 'Inativo'}</Pill>;
}

export { KebabMenu } from './KebabMenu';
export type { KebabItem } from './KebabMenu';
