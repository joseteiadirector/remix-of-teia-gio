import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a specified element
 * @param callback - Function to call when click outside is detected
 * @returns ref to attach to the element
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const dropdownRef = useClickOutside(() => setIsOpen(false));
 * 
 * return (
 *   <div ref={dropdownRef}>
 *     <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *     {isOpen && <DropdownMenu />}
 *   </div>
 * );
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback]);

  return ref;
}

/**
 * Alternative hook that accepts an existing ref
 * @param ref - Existing ref to monitor
 * @param callback - Function to call when click outside is detected
 * 
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside(dropdownRef, () => setIsOpen(false));
 * 
 * return <div ref={dropdownRef}>...</div>;
 * ```
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: () => void
): void {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, callback]);
}
