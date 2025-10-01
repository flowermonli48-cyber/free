import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';

export default function Home() {
  const navigate = useNavigate();
  const [uniqueCodeInput, setUniqueCodeInput] = useState('');

  const startChatFromHome = () => {
    if (!uniqueCodeInput.trim()) {
      alert('لطفاً کد یکتا را وارد کنید');
      return;
    }
    
    navigate('/chat', { state: { uniqueCode: uniqueCodeInput } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100">
      <NavBar title="کیس یاب" showBack={false} />

      <div className="pt-20 pb-20 px-4">
        {/* Hero Section */}
        <div className="pt-6 pb-8 px-6 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 font-pacifico">
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                کیس یاب
              </span>
            </h1>
            <p className="text-gray-600 text-lg">بزرگترین پلتفرم کیس‌یابی ایران</p>
          </div>

          {/* Hero Image */}
          <div className="mb-8 relative">
            <div className="w-full h-48 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
              <img 
                src="https://readdy.ai/api/search-image?query=Elegant%20dating%20app%20interface%2C%20modern%20romantic%20design%2C%20couple%20silhouettes%2C%20heart%20shapes%2C%20gradient%20pink%20purple%20background%2C%20mobile%20app%20mockup%2C%20love%20connection%20illustration%2C%20Persian%20romantic%20theme&width=350&height=200&seq=hero2&orientation=landscape"
                alt="پلتفرم کیس یاب"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-gray-800">500K+</div>
              <div className="text-sm text-gray-600">کاربر فعال</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-gray-800">95%</div>
              <div className="text-sm text-gray-600">موفقیت ملاقات</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-gray-800">24/7</div>
              <div className="text-sm text-gray-600">پشتیبانی آنلاین</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">خدمات ویژه</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <i className="ri-heart-fill text-white text-2xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-center">صیغه موقت</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">آشنایی با افراد برای صیغه موقت</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <i className="ri-user-heart-fill text-white text-2xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-center">شوگر دیدی</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">ارتباط با افراد موفق و ثروتمند</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <i className="ri-message-3-fill text-white text-2xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-center">چت امن</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">گفتگوی امن و محرمانه</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <i className="ri-shield-check-fill text-white text-2xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-center">تایید هویت</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">تمام کاربران تایید هویت شده</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">شروع کنید</h2>
          <div className="space-y-4">
            <button onClick={() => navigate('/services')} className="block w-full">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <i className="ri-heart-fill text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">مشاهده کیس‌ها</h3>
                    <p className="text-white/80 text-sm">پروفایل‌های تایید شده را ببینید</p>
                  </div>
                  <i className="ri-arrow-left-line text-white text-xl"></i>
                </div>
              </div>
            </button>

            {/* Inquiry Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
                <i className="ri-chat-3-line ml-2 text-pink-600"></i>
                چت و ارتباط
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                برای چت با کیس‌های خود، کد یکتا را وارد کنید
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">کد یکتا کیس</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={uniqueCodeInput}
                      onChange={(e) => setUniqueCodeInput(e.target.value)}
                      placeholder="مثال: C1234-567"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    />
                    <i className="ri-qr-code-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                </div>
                
                <button onClick={startChatFromHome} className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:via-rose-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300">
                  <i className="ri-chat-heart-line ml-2"></i>
                  شروع چت
                </button>
              </div>
            </div>

            <button onClick={() => navigate('/chat')} className="block w-full">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <i className="ri-message-3-fill text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">شروع چت</h3>
                    <p className="text-white/80 text-sm">با افراد مورد نظر چت کنید</p>
                  </div>
                  <i className="ri-arrow-left-line text-white text-xl"></i>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}