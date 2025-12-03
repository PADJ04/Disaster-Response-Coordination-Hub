import type { ReactNode } from 'react';

export type TabType = 'home' | 'volunteer' | 'report';

export interface NavigationProps {
  onNavigate: (tab: TabType) => void;
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