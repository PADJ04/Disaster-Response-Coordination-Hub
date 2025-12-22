import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export default function Modal({ children, open, onClose, title, className = "max-w-2xl" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full bg-black/90 border border-white/10 rounded-xl p-6 z-10 shadow-2xl ${className}`}>
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button className="text-sm text-white/50 hover:text-white transition-colors" onClick={onClose}>Close</button>
          </div>
        )}
        <div className="h-full overflow-auto">{children}</div>
      </div>
    </div>
  );
}
