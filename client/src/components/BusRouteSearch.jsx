import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Search input + dropdown for finding bus routes.
 * Filters busRoutes keys by service number prefix.
 */
export default function BusRouteSearch({ busRoutes, onRouteSelect, visible }) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter routes by service number prefix
  const filteredResults = useMemo(() => {
    if (!busRoutes || !searchText.trim()) return [];
    const query = searchText.trim().toLowerCase();
    return Object.keys(busRoutes).filter((key) => {
      const svcNo = key.split(' (')[0].toLowerCase();
      return svcNo.startsWith(query);
    });
  }, [busRoutes, searchText]);

  if (!visible) return null;

  const handleSelect = (routeKey) => {
    onRouteSelect(routeKey);
    setSearchText('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchText('');
      setIsOpen(false);
      e.target.blur();
    }
  };

  return (
    <div className="bus-route-search" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Search bus (e.g. 74)"
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => { if (searchText.trim()) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && filteredResults.length > 0 && (
        <div className="search-dropdown">
          {filteredResults.map((key) => (
            <div
              key={key}
              className="search-dropdown-item"
              onClick={() => handleSelect(key)}
            >
              <span style={{ fontWeight: 700 }}>{key.split(' (')[0]}</span>
              <span style={{ color: '#666' }}>{' '}({key.split(' (')[1]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
