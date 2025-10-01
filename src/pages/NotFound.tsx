import { Link } from 'react-router-dom';
import TabBar from '../components/base/TabBar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-md mx-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-error-warning-line text-gray-400 text-4xl"></i>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-300 mb-4">۴۰۴</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">صفحه یافت نشد</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          متاسفانه صفحه مورد نظر شما وجود ندارد یا حذف شده است.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300"
          >
            <i className="ri-home-4-line ml-2"></i>
            بازگشت به خانه
          </Link>
          
          <Link
            to="/services"
            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300"
          >
            <i className="ri-heart-line ml-2"></i>
            مشاهده کیس‌ها
          </Link>
        </div>
      </div>
      
      <TabBar />
    </div>
  );
}