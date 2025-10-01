import { useNavigate } from 'react-router-dom';

interface NavBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function NavBar({ title, showBack = false, onBack, rightAction }: NavBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm z-50">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="w-10 h-10 flex items-center justify-center">
          {showBack && (
            <button 
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
          )}
        </div>
        
        <h1 className="text-lg font-semibold text-gray-800 truncate">{title}</h1>
        
        <div className="w-10 h-10 flex items-center justify-center">
          {rightAction}
        </div>
      </div>
    </div>
  );
}