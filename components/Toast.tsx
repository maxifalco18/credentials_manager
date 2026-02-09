import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const isSuccess = type === 'success';

  return (
    <div 
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 max-w-sm ${
        isSuccess 
          ? 'bg-white text-green-800 border-green-200' 
          : 'bg-white text-red-800 border-red-200'
      } ${
        isVisible && !isExiting
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : 'opacity-0 translate-x-8 translate-y-2'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isSuccess ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {isSuccess 
          ? <CheckCircle className="w-4.5 h-4.5 text-green-600" /> 
          : <AlertCircle className="w-4.5 h-4.5 text-red-600" />
        }
      </div>
      <p className="text-sm font-medium flex-1 text-gray-800">{message}</p>
      <button 
        onClick={handleClose} 
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
