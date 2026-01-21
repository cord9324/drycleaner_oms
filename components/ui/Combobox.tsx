import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ComboboxOption {
    value: string;
    label: string;
    subLabel?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

const Combobox: React.FC<ComboboxProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerSearch = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(lowerSearch))
        );
    }, [options, searchTerm]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term if no selection was made or to clear filter
                if (!isOpen) {
                    setSearchTerm('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // When opening, focus input and clear search if a value is selected to allow fresh search
    // actually standard combobox behavior: keep existing value text or clear?
    // Let's adopt a style where we show the text input.

    const handleInputClick = () => {
        setIsOpen(true);
        // If we want to allow searching immediately, we might want to keep the current value visible 
        // OR clear it to type. Let's start by showing the selected label if closed, but changing to search term when open.
    };

    const handleSelect = (option: ComboboxOption) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Derived display value for the input
    // If open and typing -> show searchTerm
    // If closed and has value -> show selectedOption.label
    // If open and empty searchTerm -> show selectedOption.label? No, probably show empty or placeholder to encourage typing.

    // Actually simpler pattern:
    // Render a "display box" that looks like an input. When clicked, it opens a dropdown which CONTAINS a search input at the top.
    // This is often more robust for mobile and simpler than a dual-mode input. 
    // BUT the requirement was "Type John". 
    // So let's do the "Input is the search" style.

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm pr-8 focus:ring-2 focus:ring-primary/20 outline-none ${!selectedOption && !isOpen ? 'text-slate-500' : ''}`}
                    placeholder={selectedOption ? selectedOption.label : placeholder}
                    value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
                    onChange={(e) => {
                        setIsOpen(true);
                        setSearchTerm(e.target.value);
                        // If user clears input, should we clear value? 
                        // Maybe not immediately, wait for selection.
                    }}
                    onClick={handleInputClick}
                    onFocus={() => setIsOpen(true)}
                    required={required && !value} // Basic HTML validation trick
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">
                        {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500 text-center">
                            No matching customers found.
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filteredOptions.map((opt) => (
                                <li
                                    key={opt.value}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col ${value === opt.value ? 'bg-slate-50 dark:bg-slate-800 text-primary' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    <span className="font-medium">{opt.label}</span>
                                    {opt.subLabel && (
                                        <span className="text-xs text-slate-400">{opt.subLabel}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default Combobox;
