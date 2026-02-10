import { useEffect, useState, useRef, RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element is in the viewport using IntersectionObserver
 * @param options - IntersectionObserver options
 * @returns ref to attach to element and inView boolean
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '200px', triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<T>(null);
  const observedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If triggerOnce and already observed, skip
    if (triggerOnce && observedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInView = entry.isIntersecting;
        setInView(isInView);
        
        if (isInView && triggerOnce) {
          observedRef.current = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref as RefObject<T>, inView];
}
