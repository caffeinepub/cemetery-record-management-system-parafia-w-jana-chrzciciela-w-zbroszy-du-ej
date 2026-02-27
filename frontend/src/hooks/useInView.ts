import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element is in the viewport using IntersectionObserver.
 * Returns a tuple [ref, inView] for easy destructuring.
 * When triggerOnce=true, once the element enters the viewport it stays "in view"
 * even if the parent re-renders, preventing the B5+ alley reset bug.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [React.RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const ref = useRef<T>(null);
  const hasTriggeredRef = useRef(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If triggerOnce already fired, keep inView=true without re-observing
    if (triggerOnce && hasTriggeredRef.current) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (triggerOnce) {
              hasTriggeredRef.current = true;
              observer.disconnect();
            }
          } else if (!triggerOnce) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref as React.RefObject<T>, inView];
}
