
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/base/NavBar';
import TabBar from '../../../components/base/TabBar';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      alert('لطفاً تمامی فیلدها را پر کنید');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // بارگذاری رمز عبور ذخیره شده
      const savedCredentials = localStorage.getItem('adminCredentials');
      let validUsername = 'admin';
      let validPassword = 'admin123';
      
      if (savedCredentials) {
        try {
          const credentials = JSON.parse(savedCredentials);
          validUsername = credentials.username || 'admin';
          validPassword = credentials.password || 'admin123';
        } catch (error) {
          console.error('خطا در بارگذاری اعتبارسنجی:', error);
        }
      }

      if (formData.username === validUsername && formData.password === validPassword) {
        localStorage.setItem('adminToken', 'admin-logged-in-' + Date.now());
        alert('ورود موفق!');
        navigate('/admin/dashboard');
      } else {
        setLoading(false);
        alert('نام کاربری یا رمز عبور اشتباه است');
      }
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100">
      <NavBar title="ورود ادمین" showBack={true} />

      <div className="pt-20 pb-20 px-4 flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-admin-line text-white text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ورود پنل ادمین</h2>
            <p className="text-gray-600">جهت مدیریت سیستم وارد شوید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-3">نام کاربری</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="نام کاربری"
                  required
                />
                <i className="ri-admin-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-3">رمز عبور</label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="رمز عبور"
                  required
                />
                <i className="ri-lock-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    <i className="ri-login-circle-line ml-2 text-xl"></i>
                    ورود به پنل
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center text-gray-600">
              <i className="ri-shield-check-line text-lg ml-2"></i>
              <span className="text-sm">ورود امن به پنل مدیریت</span>
            </div>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
