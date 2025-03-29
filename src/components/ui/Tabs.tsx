import { useState } from 'react';

export function Tabs({ 
  children, 
  value, 
  onValueChange 
}: { 
  children: React.ReactNode, 
  value: string, 
  onValueChange: (value: string) => void 
}) {
  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { 
                isActive: child.props.value === value,
                onSelect: () => onValueChange(child.props.value)
              });
            }
            return child;
          })}
        </nav>
      </div>
      <div>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.props.value === value) {
            return child.props.children;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function Tab({ 
  label, 
  value, 
  isActive, 
  onSelect, 
  children 
}: { 
  label: string, 
  value: string, 
  isActive?: boolean, 
  onSelect?: () => void, 
  children?: React.ReactNode 
}) {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onSelect && onSelect(); }}
      className={`${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </a>
  );
} 