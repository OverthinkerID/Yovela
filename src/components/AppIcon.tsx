'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote,
  Bell,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  CloudUpload,
  Code2,
  Coins,
  CreditCard,
  DoorOpen,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  History,
  Home,
  IdCard,
  LayoutGrid,
  Info,
  ListOrdered,
  Loader2,
  Lock,
  LogOut,
  Megaphone,
  MessageCircle,
  Minus,
  Moon,
  Package,
  PieChart,
  Pill,
  Plus,
  Printer,
  QrCode,
  Radio,
  Receipt,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Sun,
  Tag,
  Tags,
  Ticket,
  Trash2,
  TrendingDown,
  Tv,
  User,
  UserCheck,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  type LucideProps,
} from 'lucide-react';

const ToothIcon: React.FC<LucideProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M7 3C4.8 3 3 5 3 7.5c0 2.7 1.3 4.8 2 7.2.6 2 1 5.3 2.5 5.3 1.2 0 1.7-2.2 2.5-4 .5-1.1 1.5-1.1 2 0 .8 1.8 1.3 4 2.5 4 1.5 0 1.9-3.3 2.5-5.3.7-2.4 2-4.5 2-7.2C19 5 17.2 3 15 3c-1.5 0-2.4.8-3 1.4-.6-.6-1.5-1.4-3-1.4Z" />
  </svg>
);

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  'address-card': IdCard,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-right-from-bracket': LogOut,
  'arrow-up-right-from-square': ExternalLink,
  award: Award,
  bell: Bell,
  box: Package,
  bullhorn: Megaphone,
  'calendar-check': CalendarCheck,
  'calendar-plus': CalendarPlus,
  'calendar-xmark': CalendarX,
  'cash-register': Banknote,
  'chart-pie': PieChart,
  check: Check,
  'chevron-down': ChevronDown,
  'circle-check': CheckCircle2,
  'circle-exclamation': AlertCircle,
  'circle-info': Info,
  'clock-rotate-left': History,
  'cloud-arrow-up': CloudUpload,
  code: Code2,
  coins: Coins,
  'credit-card': CreditCard,
  'door-open': DoorOpen,
  'file-excel': FileSpreadsheet,
  'file-invoice': FileText,
  'floppy-disk': Save,
  'forward-step': SkipForward,
  grid: LayoutGrid,
  hospital: Building2,
  'house-chimney': Home,
  'list-ol': ListOrdered,
  lock: Lock,
  'magnifying-glass': Search,
  'money-bill-wave': Banknote,
  'money-check-dollar': CreditCard,
  minus: Minus,
  moon: Moon,
  'notes-medical': ClipboardList,
  'paper-plane': Send,
  pills: Pill,
  plus: Plus,
  print: Printer,
  qrcode: QrCode,
  receipt: Receipt,
  'satellite-dish': Radio,
  'shield-halved': Shield,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  spinner: Loader2,
  sun: Sun,
  tags: Tags,
  ticket: Ticket,
  tooth: ToothIcon,
  trash: Trash2,
  'trending-down': TrendingDown,
  'triangle-exclamation': AlertTriangle,
  tv: Tv,
  user: User,
  'user-check': UserCheck,
  'user-clock': Clock,
  'user-doctor': Stethoscope,
  'user-plus': UserPlus,
  'user-tag': Tag,
  users: Users,
  'users-gear': Settings,
  'volume-high': Volume2,
  'volume-xmark': VolumeX,
  wallet: Wallet,
  whatsapp: MessageCircle,
  xmark: X,
};

export interface AppIconProps {
  name: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = '' }) => {
  const cleanName = name.replace(/^fa-/, '');
  const IconComp = ICON_MAP[cleanName] || CircleFallback;
  const hasSize = /\bw-\d|\bh-\d|\bsize-/.test(className);
  const sizeClass = hasSize ? '' : 'w-3.5 h-3.5';
  return <IconComp className={`inline-block shrink-0 ${sizeClass} ${className}`.trim()} aria-hidden="true" />;
};

const CircleFallback: React.FC<LucideProps> = (props) => <Info {...props} />;
