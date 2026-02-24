import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export const TabButton = React.memo(function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 cursor-pointer ${active ? 'text-violet-400 border-violet-500 bg-violet-500/10' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-500/5'}`}
    >
      {label}
    </button>
  );
});
