import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Jolshaa"
        className="w-full bg-jolshaa-surface-container-high rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30 focus:bg-jolshaa-surface-container-lowest transition-all text-jolshaa-on-surface placeholder-jolshaa-on-surface-variant"
      />
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-jolshaa-on-surface-variant"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </form>
  );
};

export default SearchBar;
