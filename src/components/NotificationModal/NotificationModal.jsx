import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, type = 'info', title, message, onConfirm, confirmText = 'OK', showCancel = false }) {
  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4 rounded-t-xl flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <Icon size={24} className={config.iconColor} />
            <h3 className={`text-lg font-bold ${config.titleColor}`}>{title}</h3>
          </div>
          {!onConfirm && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              onClose();
            }}
            className={`px-6 py-2 text-white rounded-lg font-medium transition ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
