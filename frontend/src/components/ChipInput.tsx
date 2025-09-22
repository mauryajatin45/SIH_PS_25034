import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxItems?: number;
  className?: string;
}

export default function ChipInput({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = "Type and press Enter",
  maxItems = 10,
  className = ''
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      !value.includes(suggestion) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 5);

  const addChip = (chip: string) => {
    const trimmedChip = chip.trim();
    if (trimmedChip && !value.includes(trimmedChip) && value.length < maxItems) {
      onChange([...value, trimmedChip]);
      setInputValue('');
    }
  };

  const removeChip = (chipToRemove: string) => {
    onChange(value.filter(chip => chip !== chipToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  };

  return (
    <div className={className}>
      {/* Chips Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
            >
              {chip}
              <button
                onClick={() => removeChip(chip)}
                className="hover:bg-blue-200 rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label={`Remove ${chip}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length >= maxItems ? `Maximum ${maxItems} items` : placeholder}
          disabled={value.length >= maxItems}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {/* Add Button */}
        {inputValue.trim() && (
          <button
            onMouseDown={(e) => { e.preventDefault(); addChip(inputValue); }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-orange-500 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
            aria-label="Add item"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onMouseDown={(e) => { e.preventDefault(); addChip(suggestion); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="mt-2 text-right text-xs text-gray-500">
        {value.length} / {maxItems}
      </div>
    </div>
  );
}