import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
          />

          {/* Dialog content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="relative w-full max-w-md overflow-hidden bg-wine-surface border border-wine-border rounded-xl shadow-2xl z-10 font-mono text-wine-text flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            id={`modal-dialog-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-wine-border/60 px-5 py-4">
              <h3 className="font-display font-semibold text-base text-wine-text leading-none">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-wine-faint hover:text-wine-text rounded-md p-1 hover:bg-wine-surface2 transition-all cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
