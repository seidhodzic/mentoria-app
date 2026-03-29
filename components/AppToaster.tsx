'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{
        style: {
          background: 'var(--teal)',
          color: '#ffffff',
          border: '1px solid rgba(247, 188, 21, 0.35)',
          fontFamily: "'Saira', sans-serif",
        },
      }}
    />
  );
}
