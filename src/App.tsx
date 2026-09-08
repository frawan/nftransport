/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LockScreen } from './components/LockScreen';
import { StreamScreen } from './components/StreamScreen';
import { getStoredSession, saveAuthSession, clearAuthSession } from './utils/storage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);

  // Check 7-day authentication flag in localStorage on app load
  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setIsAuthenticated(true);
      setExpiresAt(session.expiresAt);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleUnlock = () => {
    const newSession = saveAuthSession();
    setExpiresAt(newSession.expiresAt);
    setIsAuthenticated(true);
  };

  const handleLock = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  // Initial loading state to prevent flash of lock screen if already authenticated
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 flex items-center justify-center sm:p-4 font-sans antialiased text-slate-900">
      {/* Mobile Card Container matching Clean Minimalism design */}
      <div className="w-full max-w-sm min-h-screen sm:min-h-0 sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-[32px] sm:shadow-xl sm:border sm:border-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="lock-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col"
            >
              <LockScreen onUnlock={handleUnlock} />
            </motion.div>
          ) : (
            <motion.div
              key="stream-screen"
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col"
            >
              <StreamScreen onLock={handleLock} expiresAt={expiresAt} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

