import { Button } from '@/components/ui/button';
import { Map, Search, Heart, Church } from 'lucide-react';

type SectionId = 'map' | 'search' | 'prayer' | 'about';

interface PublicSectionsTilesProps {
  onSelect: (section: SectionId) => void;
}

export default function PublicSectionsTiles({ onSelect }: PublicSectionsTilesProps) {
  const tiles = [
    {
      id: 'map' as SectionId,
      icon: Map,
      label: 'Mapa grobów',
    },
    {
      id: 'search' as SectionId,
      icon: Search,
      label: 'Wyszukiwanie',
    },
    {
      id: 'prayer' as SectionId,
      icon: Heart,
      label: 'Modlitwa za zmarłych',
    },
    {
      id: 'about' as SectionId,
      icon: Church,
      label: 'Nasz cmentarz',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Button
              key={tile.id}
              onClick={() => onSelect(tile.id)}
              variant="outline"
              className="h-auto flex-col gap-4 p-8 rounded-2xl transition-all duration-300 
                bg-tile-surface hover:bg-tile-surface-hover 
                border-2 border-tile-border hover:border-tile-accent
                shadow-md hover:shadow-xl hover:scale-[1.03]
                focus-visible:ring-4 focus-visible:ring-tile-accent/50 focus-visible:border-tile-accent
                active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-full bg-tile-icon-bg flex items-center justify-center transition-colors duration-300 group-hover:bg-tile-accent/20">
                <Icon className="w-8 h-8 text-tile-icon transition-colors duration-300" />
              </div>
              <span className="text-lg font-semibold text-tile-text text-center leading-tight">
                {tile.label}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
