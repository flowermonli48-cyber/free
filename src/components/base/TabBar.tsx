import { useLocation, useNavigate } from 'react-router-dom';

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', icon: 'ri-home-4-fill', label: 'خانه' },
    { path: '/services', icon: 'ri-heart-fill', label: 'کیس‌ها' },
    { path: '/chat', icon: 'ri-message-3-fill', label: 'چت' },
    { path: '/admin/login', icon: 'ri-admin-fill', label: 'ادمین' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl z-50">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
              location.pathname === tab.path
                ? 'text-pink-600 bg-pink-50'
                : 'text-gray-500 hover:text-pink-500 hover:bg-pink-25'
            }`}
          >
            <i className={`${tab.icon} text-xl`}></i>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}