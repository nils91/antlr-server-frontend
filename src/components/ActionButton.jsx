import React, { useState, useEffect } from 'react';
import { useLongPress } from '../hooks/useDebounce';
import './ActionButton.css';

const ActionButton = ({ 
  onClick, 
  onLongPress, 
  children, 
  disabled = false,
  status = 'idle', // 'idle', 'loading', 'success', 'error'
  variant = 'default' // 'default', 'primary'
}) => {
  const [showStatus, setShowStatus] = useState(false);
  
  const longPressHandlers = useLongPress(() => {
    if (onLongPress) {
      onLongPress();
    }
  }, 1000);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleMouseUp = (e) => {
    const wasLongPress = longPressHandlers.onMouseUp(e);
    if (!wasLongPress && onClick && !disabled) {
      onClick();
    }
  };

  const getClassName = () => {
    const classes = ['action-button', `variant-${variant}`];
    if (disabled) classes.push('disabled');
    if (showStatus) classes.push(`status-${status}`);
    if (status === 'loading') classes.push('loading');
    return classes.join(' ');
  };

  return (
    <button
      className={getClassName()}
      disabled={disabled}
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
    >
      {children}
    </button>
  );
};

export default ActionButton;