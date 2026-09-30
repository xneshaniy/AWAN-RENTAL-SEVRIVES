'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  searchable?: boolean;
  multiple?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled,
  fullWidth,
  searchable = false,
  multiple = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('w-full', fullWidth && 'max-w-full')} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {error && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border transition-all duration-200 text-left flex items-center justify-between',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn('truncate', !value && 'text-gray-500')}>
            {value ? selectedOption?.label : placeholder}
          </span>
          <ChevronDown className={cn('w-5 h-5 text-gray-500 flex-shrink-0 ml-2', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        if (!multiple) setIsOpen(false);
                      }
                    }}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'text-gray-900 dark:text-gray-100',
                      value === option.value && 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="flex-1 truncate">{option.label}</span>
                    {value === option.value && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  );
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
    danger?: boolean;
  }>;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-slide-down',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}