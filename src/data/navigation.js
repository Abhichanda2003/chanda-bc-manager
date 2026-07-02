import { BarChart3, CalendarDays, DollarSign, Home, Settings, Trophy, User, Users } from 'lucide-react';

export const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/members', label: 'Members', icon: User },
  { to: '/payments', label: 'Payments', icon: DollarSign },
  { to: '/winners', label: 'Winners', icon: Trophy },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];
