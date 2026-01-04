
import React from 'react';

const GenerativeBackground: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        // Lightweight CSS alternative to the heavy canvas animation
        background: `
          radial-gradient(circle at 15% 50%, rgba(170, 142, 85, 0.03) 0%, transparent 25%),
          radial-gradient(circle at 85% 30%, rgba(170, 142, 85, 0.03) 0%, transparent 25%)
        `,
        pointerEvents: 'none',
      }}
    />
  );
};

export default GenerativeBackground;
