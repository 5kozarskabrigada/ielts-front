import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, type = 'default', actions }) => {
  if (!isOpen) return null;

  const typeStyles = {
    default: { icon: null, color: 'text-gray-900', bg: 'bg-white' },
    warning: { icon: <AlertTriangle size={24} className="text-orange-500" />, color: 'text-orange-700', bg: 'bg-orange-50' },
    success: { icon: <CheckCircle size={24} className="text-green-500" />, color: 'text-green-700', bg: 'bg-green-50' },
    danger: { icon: <AlertTriangle size={24} className="text-red-500" />, color: 'text-red-700', bg: 'bg-red-50' },
    info: { icon: <Info size={24} className="text-blue-500" />, color: 'text-blue-700', bg: 'bg-blue-50' },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${style.bg}`}>
          <div className="flex items-center space-x-3">
            {style.icon}
            <h3 className={`text-lg font-bold ${style.color}`}>{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-gray-700 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
