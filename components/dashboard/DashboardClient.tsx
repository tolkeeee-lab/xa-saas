'use client';

import { useState, useEffect } from 'react';
import OnboardingModal from './OnboardingModal';

interface DashboardClientProps {
  userId: string;
  hasBoutiques: boolean;
}

export default function DashboardClient({ userId: _userId, hasBoutiques }: DashboardClientProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hasBoutiques && typeof window !== 'undefined') {
      if (!localStorage.getItem('xa-onboarding-done')) {
        setShowModal(true);
      }
    }
  }, [hasBoutiques]);

  if (!showModal) return null;

  return <OnboardingModal />;
}
