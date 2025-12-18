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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'assigned' | 'accepted' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  volunteer_id: string;
  report_id?: string;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  images: { id: string; image_url: string }[];
}
