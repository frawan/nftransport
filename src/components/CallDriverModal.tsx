import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MessageSquare, X, ShieldAlert, User, Bus, ExternalLink } from 'lucide-react';
import { DriverInfo } from '../types';

interface CallDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverInfo;
}

export const CallDriverModal: React.FC<CallDriverModalProps> = ({
  isOpen,
  onClose,
  driver,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal / Action Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-sm bg-white border border-slate-100 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-10 text-slate-900 pb-safe"
            id="call-driver-sheet"
          >
            {/* Drag handle on mobile */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{driver.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                    <span>{driver.vanNumber} &bull; Plate: {driver.licensePlate}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="close-driver-modal-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Safety notice */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                For student safety, hands-free regulations apply while the vehicle is in motion. Urgent matters route to Transportation Dispatch.
              </span>
            </div>

            {/* Direct Actions */}
            <div className="space-y-2.5">
              <a
                href={`tel:${driver.phone.replace(/\D/g, '')}`}
                id="direct-call-link"
                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Phone className="w-4 h-4 text-white" />
                <span>Call Driver: {driver.phone}</span>
              </a>

              <a
                href={`sms:${driver.phone.replace(/\D/g, '')}?body=Hi%20${encodeURIComponent(driver.name)},%20regarding%20Van%201%20pickup:`}
                id="direct-sms-link"
                className="w-full h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-200/90 shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Text Message Driver</span>
              </a>

              <a
                href={`tel:${driver.dispatchPhone.replace(/\D/g, '')}`}
                id="direct-dispatch-link"
                className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Call School Dispatch ({driver.dispatchPhone})</span>
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Dismiss
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
