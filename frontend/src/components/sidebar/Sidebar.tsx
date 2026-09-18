import { NavLink } from 'react-router-dom';
import {
  ChefHat,
  ShoppingCart,
  UtensilsCrossed,
  Grid3x3,
  ClipboardList,
  Package,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  { to: '/pos', label: 'POS / Billing', icon: ShoppingCart },
  { to: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { to: '/tables', label: 'Table Management', icon: Grid3x3 },
  { to: '/orders', label: 'Order Management', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory / Stock', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const renderLink = ({ to, label, icon: Icon }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-primary-600/15 text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-primary-500" />
          )}
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-sidebar transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-4 pt-5 pb-6',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
          <ChefHat size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-base font-bold text-white">FoodPOS</p>
            <p className="text-[11px] text-gray-400">Smart Restaurant Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(renderLink)}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : (
            <>
              <PanelLeftClose size={20} />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}