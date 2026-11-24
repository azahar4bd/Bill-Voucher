import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  keywords?: string;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

function normalizeForSearch(s: string): string {
  return s.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'খুঁজুন বা সিলেক্ট করুন...',
  emptyText = 'কোনো ফলাফল পাওয়া যায়নি',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return options;
    return options.filter((opt) => {
      const hay = normalizeForSearch(`${opt.label} ${opt.keywords || ''}`);
      return hay.includes(q);
    });
  }, [options, query]);

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    setHighlightIdx(0);
  }, [query, isOpen]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    close();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setHighlightIdx((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setHighlightIdx((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      if (filteredOptions[highlightIdx]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightIdx].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#5B6962] absolute left-3 pointer-events-none" />
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => (isOpen ? close() : setIsOpen(true))}
          onKeyDown={handleTriggerKeyDown}
          className="w-full pl-8 pr-14 py-2 text-left text-sm bg-white border border-[#006633]/45 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] cursor-pointer"
        >
          <span className={`block truncate ${selectedOption ? 'text-[#131C18]' : 'text-[#7A8881]'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6962] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {value !== '' && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              close();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-[#6C7A73] hover:text-[#C62828] rounded cursor-pointer"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-[#DCE3DF] rounded-md shadow-lg">
          {/* Search field only: it never receives focus when the dropdown opens. */}
          <div className="relative border-b border-[#E7ECE9]">
            <Search className="w-3.5 h-3.5 text-[#5B6962] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              autoFocus={false}
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="এখানে টাইপ করে খুঁজুন..."
              className="w-full pl-8 pr-8 py-2 text-sm bg-white rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#006633]/30 text-[#131C18] placeholder:text-[#7A8881]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6C7A73] hover:text-[#C62828] rounded cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <ul role="listbox" className="max-h-56 overflow-y-auto py-1 text-sm">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#6C7A73]">{emptyText}</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIdx;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F5E9] text-[#006633] font-semibold'
                        : isHighlighted
                        ? 'bg-[#F4F6F5] text-[#131C18]'
                        : 'text-[#24332C]'
                    }`}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
