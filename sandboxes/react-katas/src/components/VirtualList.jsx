import React from 'react';

export function VirtualList({ items, itemHeight = 32, height = 320, renderItem }) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(height / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const topOffset = startIndex * itemHeight;

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

  return (
    <div style={{ height, overflowY: 'auto', border: '1px solid #ddd' }} onScroll={onScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${topOffset}px)` }}>
          {items.slice(startIndex, endIndex).map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight, display: 'flex', alignItems: 'center', padding: '0 8px', borderBottom: '1px solid #f3f3f3' }}>
              {renderItem ? renderItem(item, startIndex + i) : item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
