import React, { useState, useRef, useEffect } from 'react';

const audiences = [
  { value: 'public', label: 'Public', icon: '🌍', description: 'Anyone can see this post' },
  { value: 'friends', label: 'Friends', icon: '👥', description: 'Only friends can see' },
  { value: 'close_friends', label: 'Close Friends', icon: '💚', description: 'Only close friends can see' },
  { value: 'custom', label: 'Custom', icon: '⚙️', description: 'Choose specific people' },
  { value: 'onlyme', label: 'Only Me', icon: '🔒', description: 'Only you can see this' }
];

export default function AudienceSelector({ value = 'public', onChange, dark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = audiences.find(a => a.value === value) || audiences[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
          ${dark
            ? 'bg-white/5 hover:bg-white/10 text-[#dae2fd] border border-white/10'
            : 'bg-black/5 hover:bg-black/10 text-[#202020] border border-black/10'
          }`}
      >
        <span>{selected.icon}</span>
        <span>{selected.label}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 w-64 rounded-xl border shadow-lg overflow-hidden
          ${dark ? 'bg-[#171f33] border-white/10' : 'bg-white border-black/10'}`}>
          {audiences.map(audience => (
            <button
              key={audience.value}
              onClick={() => { onChange(audience.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${value === audience.value
                  ? dark ? 'bg-purple-500/20 text-[#d0bcff]' : 'bg-purple-100 text-purple-700'
                  : dark ? 'hover:bg-white/5 text-[#dae2fd]' : 'hover:bg-black/5 text-[#202020]'
                }`}
            >
              <span className="text-lg">{audience.icon}</span>
              <div>
                <div className="font-medium text-sm">{audience.label}</div>
                <div className={`text-xs ${dark ? 'text-white/50' : 'text-black/50'}`}>{audience.description}</div>
              </div>
              {value === audience.value && (
                <svg className="w-4 h-4 ml-auto text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}