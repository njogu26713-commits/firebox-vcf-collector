import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Flame, 
  LayoutDashboard, 
  FolderOpen, 
  PlusCircle, 
  BarChart2, 
  Settings, 
  LogOut, 
  Bell, 
  User,
  Menu
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'My VCF Campaigns', icon: FolderOpen },
  { href: '/create', label: 'Create New VCF', icon: PlusCircle },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300
        md:translate-x-0 md:static flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group outline-none">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Firebox</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 outline-none
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'}
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-sidebar-foreground/70'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button 
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-all duration-200 outline-none"
            data-testid="nav-logout"
          >
            <LogOut className="w-5 h-5 text-sidebar-foreground/70" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background z-40 sticky top-0 shrink-0">
          <div className="flex items-center">
            <button 
              className="md:hidden p-2 -ml-2 mr-2 text-foreground/70 hover:text-foreground outline-none rounded-lg hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2 group outline-none cursor-pointer" onClick={() => window.location.href = '/'}>
              <Flame className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg tracking-tight">Firebox</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors outline-none relative" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
            </button>
            
            <Link href="/create" className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(255,106,0,0.3)] outline-none" data-testid="button-create-vcf-topbar">
              <PlusCircle className="w-4 h-4" />
              Create New VCF
            </Link>
            
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors" data-testid="button-user-profile">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Mobile backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}