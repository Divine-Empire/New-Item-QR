import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

const CustomSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Select Option",
    disabled = false,
    required = false,
    name,
    multiSelect = false,
    selectedValues = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(50); // Start with 50 items
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        // Reset visible count when dropdown opens
        if (isOpen) {
            setVisibleCount(50);
        }
    }, [isOpen]);

    // Handle scroll to load more items
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Load more when scrolled to 80% of the content
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            setVisibleCount(prev => prev + 50);
        }
    };

    const handleSelect = (optionValue) => {
        if (multiSelect) {
            // Toggle selection for multi-select
            const newValues = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];

            if (onChange) {
                onChange({ target: { name, value: newValues } });
            }
        } else {
            // Single select closes dropdown
            if (onChange) {
                onChange({ target: { name, value: optionValue } });
            }
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const handleRemoveItem = (itemToRemove, e) => {
        e.stopPropagation();
        const newValues = selectedValues.filter(v => v !== itemToRemove);
        if (onChange) {
            onChange({ target: { name, value: newValues } });
        }
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        if (onChange) {
            onChange({ target: { name, value: [] } });
        }
    };

    const filteredOptions = options.filter(option =>
        String(option || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show items progressively based on scroll position
    const displayOptions = filteredOptions.slice(0, visibleCount);

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 text-sm border rounded-md flex items-center justify-between transition-all bg-white h-[42px]
                    ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300'}
                `}
            >
                <div className="flex-1 flex gap-1 items-center overflow-hidden">
                    {multiSelect && selectedValues.length > 0 ? (
                        <>
                            {/* Show only first 2 items */}
                            {selectedValues.slice(0, 2).map((item, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium max-w-[120px] truncate flex-shrink-0"
                                    title={item}
                                >
                                    <span className="truncate">{item}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveItem(item, e)}
                                        className="hover:text-blue-900 flex-shrink-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {/* Show count if more than 2 selected */}
                            {selectedValues.length > 2 && (
                                <span className="inline-flex items-center bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                                    +{selectedValues.length - 2} more
                                </span>
                            )}
                        </>
                    ) : (
                        <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
                            {value || placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                // Fixed: bottom-full for upward opening as requested, z-[100] for visibility
                <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        {multiSelect && selectedValues.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="mt-2 w-full text-xs text-red-600 hover:text-red-700 font-medium py-1"
                            >
                                Clear All ({selectedValues.length})
                            </button>
                        )}
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto max-h-60"
                        onScroll={handleScroll}
                    >
                        {displayOptions.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                {searchTerm ? 'No matches found' : 'No options available'}
                            </div>
                        ) : (
                            <ul className="py-1">
                                {displayOptions.map((option, index) => {
                                    const isSelected = multiSelect
                                        ? selectedValues.includes(option)
                                        : value === option;

                                    return (
                                        <li
                                            key={index}
                                            onClick={() => handleSelect(option)}
                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between group
                                                ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
                                            `}
                                        >
                                            <span className="flex items-center gap-2 flex-1 min-w-0 whitespace-normal break-words group-hover:text-blue-800">
                                                {multiSelect && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="rounded border-gray-300 text-blue-600 flex-shrink-0 mt-0.5"
                                                    />
                                                )}
                                                <span className="leading-snug">{option}</span>
                                            </span>
                                            {!multiSelect && isSelected && <Check size={14} className="text-blue-600 flex-shrink-0 ml-2" />}
                                        </li>
                                    );
                                })}
                                {displayOptions.length < filteredOptions.length && (
                                    <li className="px-3 py-2 text-xs text-gray-400 text-center">
                                        Showing {displayOptions.length} of {filteredOptions.length} - Scroll for more
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
