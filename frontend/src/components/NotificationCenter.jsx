import React, { useState } from 'react';
import { Bell, Check, X, Users, CheckCircle, XCircle, Clock, Info, ArrowLeft } from 'lucide-react';
import { useToast } from './Toast';
import { ButtonSpinner } from './LoadingSpinner';

export default function NotificationCenter({
  notifications = [],
  token,
  onRefresh,
  onClose
}) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleRespond = async (notifId, action) => {
    setLoadingId(notifId);
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to process invitation');
      }

      setActionMessage(data.message);
      if (action === 'accept') {
        toast.success(data.message || 'Group invitation accepted!');
      } else {
        toast.info(data.message || 'Group invitation declined.');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
      toast.error(err.message || 'Failed to process invitation response');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('All notifications marked as read');
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to mark notifications as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Network error marking notifications');
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.info('Notification marked as read');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="w-full classic-card overflow-hidden animate-fade-up text-left">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Inbox
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500">Invites and assignment updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-semibold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              aria-label="Close inbox"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Action feedback banners */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-400">
              When a student invites you to join a group, your invitation will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = item.status === 'unread';
            const isInvite = item.type === 'group_invite';
            const isPending = item.invitation_status === 'pending';
            const isAccepted = item.invitation_status === 'accepted';
            const isRejected = item.invitation_status === 'rejected';

            return (
              <div
                key={item.id}
                onClick={() => isUnread && handleMarkRead(item.id)}
                className={`p-4 sm:p-5 transition-colors relative ${
                  isUnread ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                }`}
              >
                {isUnread && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600" />
                )}

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700 font-bold">
                    {isInvite ? (
                      <Users className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Info className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 pr-4">
                      <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.message}
                    </p>

                    {item.group_name && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-800 font-bold">
                        <Users className="w-3 h-3 text-indigo-600" /> Group: {item.group_name}
                      </div>
                    )}

                    {/* Invitation Action Buttons */}
                    {isInvite && isPending && (
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          disabled={loadingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(item.id, 'accept');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 min-h-11 cursor-pointer"
                        >
                          {loadingId === item.id ? <ButtonSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          <span>Accept</span>
                        </button>
                        <button
                          disabled={loadingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(item.id, 'reject');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 min-h-11 cursor-pointer"
                        >
                          {loadingId === item.id ? <ButtonSpinner className="w-4 h-4" /> : <X className="w-4 h-4 text-slate-500" />}
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {/* Invitation Status Badges */}
                    {isInvite && isAccepted && (
                      <div className="pt-1">
                        <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Joined Group
                        </span>
                      </div>
                    )}

                    {isInvite && isRejected && (
                      <div className="pt-1">
                        <span className="badge bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-semibold inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Invitation Declined
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
