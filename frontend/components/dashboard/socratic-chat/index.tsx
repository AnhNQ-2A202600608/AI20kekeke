'use client';

import React from 'react';
import type { TabType } from '@/lib/dashboard-tabs';
import { StudentChatTab } from './student';

interface SocraticChatTabProps {
  setActiveTab: (tab: TabType) => void;
  loggedIn: boolean;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  activeTab?: string;
}

export const SocraticChatTab: React.FC<SocraticChatTabProps> = (props) => {
  return <StudentChatTab {...props} />;
};

export default SocraticChatTab;
