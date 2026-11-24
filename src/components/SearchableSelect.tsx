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
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setHighlightIdx(0);
  }, [query, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (filteredOptions.length > 0) {
        setHighlightIdx((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredOptions.length > 0) {
        setHighlightIdx((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredOptions[highlightIdx]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightIdx].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  const displayText = isOpen ? query : selectedOption ? selectedOption.label : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#5B6962] absolute left-3 pointer-events-none" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
          value={displayText}
          placeholder={selectedOption && !isOpen ? selectedOption.label : placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-8 pr-14 py-2 text-sm bg-white border border-[#006633]/45 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006633]/30 focus:border-[#006633] text-[#131C18] placeholder:text-[#7A8881]"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value !== '' && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 text-[#6C7A73] hover:text-[#C62828] rounded cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
                setQuery('');
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-[#5B6962] hover:text-[#131C18] rounded cursor-pointer"
            aria-label="Toggle options"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#DCE3DF] rounded-md shadow-lg py-1 text-sm"
        >
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt.value);
                  }}
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
      )}
    </div>
  );
};
