import React from 'react';

type Switcher4Props = {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
};

const Switcher4: React.FC<Switcher4Props> = ({
  checked,
  onChange,
  disabled,
  className = '',
  title,
}) => {
  return (
    <label
      className={`flex cursor-pointer select-none items-center ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
      title={title}
      onClick={(e) => e.stopPropagation()} // prevent row click
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`box block h-8 w-14 rounded-full transition-colors ${
            checked ? 'bg-primary-600' : 'bg-gray-400 dark:bg-gray-600'
          }`}
        />
        <div
          className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </div>
    </label>
  );
};

export default Switcher4;
