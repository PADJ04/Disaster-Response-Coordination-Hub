import type { ReactNode } from 'react';

export type TabType = 'home' | 'volunteer-signup' | 'report' | 'login' | 'district-signup' | 'live-data';

export interface NavigationProps {
  onNavigate: (tab: TabType) => void;
}

export interface LoginProps extends NavigationProps {
  onLogin: (role: 'volunteer' | 'district') => void;
}

export interface BackProps {
  onBack: () => void;
}

export interface HudCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

export interface InputGroupProps {
  label: string;
  type?: string;
  placeholder: string;
  theme?: 'teal' | 'red';
}