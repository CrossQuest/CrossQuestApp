import { useEffect } from 'react';
import '../styles/notification-popup.css';

export default function NotificationPopup({ message, type = 'info', isVisible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="notification-overlay">
      <div className={`notification-popup ${type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {type === 'success' && '✅'}
            {type === 'error' && '❌'}
            {type === 'warning' && '⚠️'}
            {type === 'info' && 'ℹ️'}
          </div>
          <div className="notification-message">{message}</div>
        </div>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
} 