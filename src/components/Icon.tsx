import React from 'react';
import {
  Home,
  TrendingUp,
  TrendingDown,
  Receipt,
  BarChart3,
  Target,
  PieChart,
  User,
  Bell,
  Users,
  Settings,
  Menu,
  X,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Pencil,
  Trash2,
  Plus,
  LogOut,
  Lightbulb,
  Calendar,
  CheckCircle2,
  Table,
  Download,
  Share2,
  Sparkles,
  Film,
  UtensilsCrossed,
  Stethoscope,
  GraduationCap,
  Coffee,
  Briefcase,
  Wallet,
  Car,
  Folder,
  Lock,
  Info,
  PiggyBank,
  CreditCard,
  Mail,
  BellRing,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Minus,
  Plane,
  Gem,
  PartyPopper,
  Gamepad2,
  RefreshCw,
  Play,
  Pause,
  type LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  // Navigation
  home: Home,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  receipt_long: Receipt,
  assessment: BarChart3,
  track_changes: Target,
  pie_chart: PieChart,
  person: User,
  notifications: Bell,
  group: Users,
  settings: Settings,
  menu: Menu,
  close: X,
  more_horiz: MoreHorizontal,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  
  // Actions
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  download: Download,
  share: Share2,
  logout: LogOut,
  
  // Common
  shopping_bag: ShoppingBag,
  lightbulb: Lightbulb,
  event: Calendar,
  check_circle: CheckCircle2,
  table_chart: Table,
  folder: Folder,
  lock: Lock,
  info: Info,
  lock_reset: Lock,
  
  // Categories
  spa: Sparkles,
  movie: Film,
  restaurant: UtensilsCrossed,
  local_hospital: Stethoscope,
  school: GraduationCap,
  local_cafe: Coffee,
  work: Briefcase,
  payments: Wallet,
  directions_car: Car,
  savings: PiggyBank,
  
  // Others
  mail: Mail,
  notifications_off: Bell,
  notifications_active: BellRing,
  receipt: Receipt,
  email: Mail,
  check: Check,
  minus: Minus,
  alert_triangle: AlertTriangle,
  warning: AlertTriangle,
  error: AlertTriangle,
  eye: Eye,
  eye_off: EyeOff,
  help: Info,
  flight: Plane,
  diamond: Gem,
  celebration: PartyPopper,
  sports_esports: Gamepad2,
  refresh: RefreshCw,
  
  // Media controls
  play_circle: Play,
  pause_circle: Pause,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  fill?: boolean;
}

export function Icon({ name, className = '', size = 24, fill = false }: IconProps) {
  const LucideIcon = iconMap[name] || iconMap['folder'];
  
  const props: React.SVGProps<SVGSVGElement> & { size?: number } = {
    className,
    size,
    strokeWidth: fill ? 1.5 : 2,
  };
  
  if (fill) {
    props.fill = 'currentColor';
  }
  
  return <LucideIcon {...props} />;
}

export { iconMap };