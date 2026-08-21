import { useState } from 'react';
import Modal, { ModalActions } from './Modal';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

/**
 * Confirmação para ações sem volta.
 *
 * O botão só é destrutivo quando a ação é destrutiva, e ele espera a resposta
 * antes de fechar — antes o diálogo sumia na hora e, se a exclusão falhasse,
 * o usuário já tinha perdido o contexto do que tentou apagar.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-fg-muted">{message}</p>

      <ModalActions>
        <button type="button" onClick={onClose} disabled={busy} className="btn btn-quiet btn-lg">
          {cancelText}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={handleConfirm}
          disabled={busy}
          data-busy={busy || undefined}
          className={`btn btn-lg ${destructive ? 'btn-danger' : 'btn-primary'}`}
        >
          {confirmText}
        </button>
      </ModalActions>
    </Modal>
  );
}
