import { useState } from 'react';
import React from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueLabel?: string;
  containerClassName?: string;
}

export function Slider({ 
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  valueLabel,
  className = '',
  containerClassName = '',
  ...props 
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showInput, setShowInput] = useState(false);
  const isMobile = useIsMobile();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (newValue >= min && newValue <= max) {
      setLocalValue(newValue);
      onChange?.(newValue);
    }
  };
  
  const percentage = ((localValue - min) / (max - min)) * 100;
  
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
          )}
          {showValue && (
            <button
              type="button"
              onClick={() => isMobile && setShowInput(!showInput)}
              className={`text-sm font-semibold text-espirito-600 dark:text-espirito-400 ${isMobile ? 'cursor-pointer hover:underline' : ''}`}
            >
              {valueLabel || localValue}
            </button>
          )}
        </div>
      )}
      
      {/* Input numérico mobile */}
      {isMobile && showInput && (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center text-lg font-semibold"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowInput(false)}
            className="px-4 py-2 bg-espirito-600 text-white rounded-lg font-medium"
          >
            OK
          </button>
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
          {...props}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// CSS adicional necessário para o slider (adicione ao index.css se necessário)
/*
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
*/
