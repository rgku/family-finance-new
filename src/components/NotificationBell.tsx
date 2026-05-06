"use client";

import { useState } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Icon } from "./Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    // 1. Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // 2. Close dropdown
    setIsOpen(false);
    
    // 3. Navigate to URL if exists
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)}h`;
    return `Há ${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
        aria-label="Notificações"
      >
        <Icon name="notifications" size={20} className="text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[99]" 
            onClick={() => setIsOpen(false)}
          />

          {/* Panel - Fixed positioning with higher z-index than sidebar (z-50) */}
          {/* Desktop: positioned to start after sidebar (256px = w-64) with fixed width */}
          {/* Mobile: full width with margins */}
          <div className="fixed top-16 left-64 w-96 bg-surface-container rounded-2xl shadow-2xl z-[100] overflow-hidden max-md:left-4 max-md:right-4 max-md:w-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-container-highest">
              <h3 className="font-bold text-lg text-on-surface">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <Icon name="notifications_none" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Sem notificações</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-container-highest">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-surface-container-highest transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon based on type */}
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-transparent'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium text-sm ${
                              !notification.read ? 'text-on-surface' : 'text-on-surface-variant'
                            }`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-on-surface-variant hover:text-error transition-colors"
                            >
                              <Icon name="close" size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-on-surface-variant">
                              {getTimeAgo(notification.created_at)}
                            </span>
                            {notification.url && (
                              <Link
                                href={notification.url}
                                className="text-xs text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Ver →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-surface-container-highest text-center">
                <Link
                  href="/dashboard/alerts"
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas as notificações
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
