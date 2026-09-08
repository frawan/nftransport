import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Bus, Delete, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DEFAULT_PIN } from '../utils/storage';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus hidden input for mobile/desktop keyboards
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDigit = (digit: string) => {
    if (isSubmitting || pin.length >= 4) return;
    setError(null);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPin('');
    setError(null);
  };

  const validatePin = (inputPin: string) => {
    setIsSubmitting(true);
    if (inputPin === DEFAULT_PIN) {
      setError(null);
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => {
        setError('Incorrect PIN. Please re-enter.');
        setShakeKey((prev) => prev + 1);
        setPin('');
        setIsSubmitting(false);
      }, 250);
    }
  };

  const handleQuickDemoFill = () => {
    setPin(DEFAULT_PIN);
    setError(null);
    validatePin(DEFAULT_PIN);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 text-slate-900">
      {/* Top Bar / Status */}
      <div className="w-full flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Guardian Ride</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/80 rounded-full px-2.5 py-0.5 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>7-Day Auth</span>
        </div>
      </div>

      {/* Main Clean Splash Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full bg-white border border-slate-100 rounded-[32px] p-6 sm:p-7 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center my-auto"
        id="lock-screen-card"
      >
        {/* Clean Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <Bus className="w-7 h-7 text-blue-600" />
        </div>

        {/* Clean Headings */}
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
          Enter Access PIN
        </h2>
        <p className="text-xs text-slate-400 mb-6 max-w-[240px] leading-relaxed font-medium">
          To ensure child safety, please enter your unique 4-digit code.
        </p>

        {/* PIN Digit Indicators */}
        <motion.div
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [-10, 10, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-center gap-3 mb-5"
          onClick={() => inputRef.current?.focus()}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            const isCurrent = pin.length === index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-200 text-xl font-bold select-none ${
                  isFilled
                    ? 'border-slate-400 bg-slate-100 text-slate-900 scale-102'
                    : isCurrent
                    ? 'border-blue-600 bg-blue-50/50 text-blue-600'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {isFilled ? '●' : ''}
              </div>
            );
          })}
        </motion.div>

        {/* Hidden Native Input */}
        <input
          ref={inputRef}
          type="tel"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(val);
            if (val.length === 4) {
              validatePin(val);
            }
          }}
          className="sr-only"
          aria-label="4-digit access PIN"
          autoComplete="one-time-code"
        />

        {/* Status / Error feedback */}
        <div className="h-6 flex items-center justify-center text-xs font-semibold mb-3">
          {error ? (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-600 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              {error}
            </motion.span>
          ) : isSubmitting && pin.length === 4 ? (
            <span className="text-blue-600 flex items-center gap-1.5 font-bold animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verifying credentials...
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">Protected session remembered for 7 days</span>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[250px] select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              id={`pin-btn-${d}`}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-900 active:text-white border border-slate-200/80 text-slate-800 font-bold text-lg flex items-center justify-center transition-colors shadow-2xs"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            id="pin-btn-clear"
            onClick={handleClear}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-400 text-[10px] font-bold flex items-center justify-center transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            type="button"
            id="pin-btn-0"
            onClick={() => handleDigit('0')}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-900 active:text-white border border-slate-200/80 text-slate-800 font-bold text-lg flex items-center justify-center transition-colors shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            id="pin-btn-delete"
            onClick={handleDelete}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-500 flex items-center justify-center transition-colors active:text-rose-500"
            aria-label="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Unlock Button COMMENTED OUT PER USER REQUEST:
        <div className="mt-4 pt-3.5 border-t border-slate-100 w-full flex items-center justify-center">
          <button
            type="button"
            id="quick-demo-unlock-btn"
            onClick={handleQuickDemoFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 text-xs font-semibold transition-colors"
          >
            <span>Demo PIN: <strong className="font-mono text-blue-900">1234</strong></span>
            <ArrowRight className="w-3 h-3 text-blue-600" />
          </button>
        </div>
        */}
      </motion.div>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-400 font-medium">
        School Transport Telematics &bull; Fleet Van 1
      </footer>
    </div>
  );
};

