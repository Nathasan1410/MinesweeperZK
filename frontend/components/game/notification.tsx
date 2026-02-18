/**
 * Notification Component
 * Toast notifications for game events
 */

'use client';

import { Notification as NotificationType } from '@/lib/game/types';
import { THEME_COLORS } from '@/lib/game/types';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationProps {
  notification: NotificationType;
}

export function Notification({ notification }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, (notification.duration || 5000) - 500); // Start fade out 500ms before end

    return () => clearTimeout(timer);
  }, [notification]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'rgba(83, 141, 78, 0.9)',
          border: THEME_COLORS.safe,
          text: '#fff',
        };
      case 'warning':
        return {
          bg: 'rgba(181, 159, 59, 0.9)',
          border: THEME_COLORS.flag,
          text: '#fff',
        };
      case 'error':
        return {
          bg: 'rgba(218, 79, 73, 0.9)',
          border: THEME_COLORS.mine,
          text: '#fff',
        };
      case 'info':
      default:
        return {
          bg: 'rgba(58, 58, 60, 0.9)',
          border: THEME_COLORS.border,
          text: THEME_COLORS.textPrimary,
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full rounded-lg shadow-2xl transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5" style={{ color: colors.text }}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm"
            style={{ color: colors.text }}
          >
            {notification.title}
          </p>
          <p
            className="text-sm mt-1 opacity-90"
            style={{ color: colors.text }}
          >
            {notification.message}
          </p>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: colors.text }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
