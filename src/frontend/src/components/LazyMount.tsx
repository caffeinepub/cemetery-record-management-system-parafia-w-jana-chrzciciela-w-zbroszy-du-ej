import { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

interface LazyMountProps {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
  placeholder?: ReactNode;
}

/**
 * Component that only mounts its children when they are near the viewport
 * Useful for heavy content like large grids or maps
 */
export default function LazyMount({
  children,
  className,
  rootMargin = '400px',
  placeholder,
}: LazyMountProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin, triggerOnce: true });

  return (
    <div ref={ref} className={className}>
      {inView ? children : placeholder}
    </div>
  );
}
