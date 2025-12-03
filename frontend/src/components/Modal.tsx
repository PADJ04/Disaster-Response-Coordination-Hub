import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export default function Modal({ children, open, onClose, title }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl mx-auto bg-black/80 border border-white/10 rounded-xl p-6 z-10">
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="text-sm text-white/70" onClick={onClose}>Close</button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
