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
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Button
              key={tile.id}
              onClick={() => onSelect(tile.id)}
              variant="outline"
              className="h-auto flex-col gap-5 p-10 rounded-2xl transition-all duration-300 
                bg-tile-surface hover:bg-tile-surface-hover 
                border-2 border-tile-border hover:border-tile-accent
                shadow-lg hover:shadow-2xl hover:scale-105
                focus-visible:ring-4 focus-visible:ring-tile-accent/60 focus-visible:border-tile-accent
                active:scale-[0.97]"
            >
              <div className="w-20 h-20 rounded-full bg-tile-icon-bg flex items-center justify-center transition-all duration-300 shadow-md">
                <Icon className="w-10 h-10 text-tile-icon transition-colors duration-300" />
              </div>
              <span className="text-xl font-bold text-tile-text text-center leading-snug">
                {tile.label}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
