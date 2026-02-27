import { Map, Search, Heart, Church } from 'lucide-react';

type SectionId = 'map' | 'search' | 'prayer' | 'about';

interface PublicNavigationBarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
}

const navItems: { id: SectionId; icon: React.ElementType; label: string }[] = [
  { id: 'map', icon: Map, label: 'Mapa grobów' },
  { id: 'search', icon: Search, label: 'Wyszukiwanie' },
  { id: 'prayer', icon: Heart, label: 'Modlitwa za zmarłych' },
  { id: 'about', icon: Church, label: 'Nasz cmentarz' },
];

export default function PublicNavigationBar({ activeSection, onSectionChange }: PublicNavigationBarProps) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <ul className="flex items-stretch justify-center gap-0 overflow-x-auto scrollbar-none">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeSection === id;
            return (
              <li key={id} className="flex-shrink-0">
                <button
                  onClick={() => onSectionChange(id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-4 text-sm font-semibold
                    transition-all duration-200 whitespace-nowrap
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset
                    ${isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">
                    {id === 'map' ? 'Mapa' : id === 'search' ? 'Szukaj' : id === 'prayer' ? 'Modlitwa' : 'Cmentarz'}
                  </span>

                  {/* Active indicator */}
                  <span
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5 rounded-full
                      transition-all duration-200
                      ${isActive ? 'bg-primary opacity-100' : 'opacity-0'}
                    `}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
