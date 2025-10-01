import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';

interface CaseData {
  id: number;
  name: string;
  image: string;
  location: string;
  price: number;
  uniqueCode: string;
  description: string;
}

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);

  const { code, caseId, caseName, caseImage } = location.state || {};

  useEffect(() => {
    // بارگذاری اطلاعات کیس از localStorage
    const loadCaseData = () => {
      try {
        // ابتدا از lastPaymentCase
        let savedCase = localStorage.getItem('lastPaymentCase');
        if (savedCase) {
          const parsedCase = JSON.parse(savedCase);
          setCaseData(parsedCase);
          return;
        }

        // سپس از selectedCase
        if (caseId) {
          savedCase = localStorage.getItem(`selectedCase_${caseId}`);
          if (savedCase) {
            const parsedCase = JSON.parse(savedCase);
            setCaseData(parsedCase);
            return;
          }
        }

        // در نهایت از state های ارسالی
        if (code && caseName) {
          setCaseData({
            id: parseInt(caseId) || 1,
            name: caseName,
            image: caseImage || 'https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%2C%20elegant%20hijab%20style%2C%20professional%20headshot%2C%20warm%20smile%2C%20traditional%20Iranian%20beauty%2C%20studio%20lighting%2C%20modern%20modest%20fashion&width=300&height=400&seq=success1&orientation=portrait',
            location: 'تهران',
            price: 250000,
            uniqueCode: code,
            description: 'کیس تایید شده با پرداخت موفق'
          });
        }
      } catch (error) {
        console.error('خطا در بارگذاری اطلاعات کیس:', error);
      }
    };

    loadCaseData();
  }, [code, caseId, caseName, caseImage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        alert('کد کپی شد!');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('کد کپی شد!');
      } catch (err) {
        alert('خطا در کپی کردن');
      }
      document.body.removeChild(textArea);
    }
  };

  const startChatWithCase = () => {
    if (code && caseData?.name) {
      navigate('/chat', { 
        state: { 
          uniqueCode: code, 
          contactName: caseData.name 
        } 
      });
    } else {
      navigate('/chat');
    }
  };

  const displayCode = code || caseData?.uniqueCode || 'C0000-000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <NavBar title="پرداخت موفق" showBack={false} />

      <div className="pt-20 pb-20 px-4">
        {/* Success Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
            <i className="ri-checkbox-circle-fill text-white text-4xl"></i>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-3">پرداخت با موفقیت انجام شد! ✅</h1>
          <p className="text-gray-600 mb-4 leading-relaxed">حالا می‌توانید با کیس انتخابی خود ارتباط برقرار کنید</p>
          
          {/* Unique Code */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="ri-qr-code-line text-blue-600 text-xl ml-3"></i>
                <div>
                  <p className="text-blue-800 text-sm font-semibold">کد یکتا کیس شما</p>
                  <p className="text-blue-600 font-mono text-lg font-bold">{displayCode}</p>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(displayCode)} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center"
              >
                <i className="ri-file-copy-line ml-1"></i>
                کپی
              </button>
            </div>
          </div>
        </div>

        {/* Case Details */}
        {caseData && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-6 mb-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
              <i className="ri-user-heart-line mr-3 text-green-600"></i>
              جزئیات کیس انتخابی
            </h3>
            
            <div className="flex items-center mb-6">
              <img 
                src={caseData.image}
                alt={caseData.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg mr-4"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-xl">{caseData.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{caseData.location}</p>
                <div className="flex items-center">
                  <i className="ri-price-tag-3-line text-green-600 ml-1"></i>
                  <span className="text-green-600 font-semibold">{formatPrice(caseData.price)} تومان</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-700 leading-relaxed text-sm">{caseData.description}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-3xl p-6 shadow-xl text-white mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-chat-heart-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">مراحل بعدی</h3>
            <p className="text-white/90 leading-relaxed text-sm mb-4">
              برای شروع گفتگو و هماهنگی‌های لازم جهت دیدار، از یکی از راه‌های زیر استفاده کنید:
            </p>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-right">
              <div className="flex items-start mb-3">
                <i className="ri-arrow-left-line text-white ml-3 mt-1"></i>
                <p className="text-white/95 text-sm">کلیک روی دکمه "شروع چت" در پایین</p>
              </div>
              <div className="flex items-start">
                <i className="ri-arrow-left-line text-white ml-3 mt-1"></i>
                <p className="text-white/95 text-sm">یا از بخش چت، کد یکتا را استعلام کنید</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button 
            onClick={startChatWithCase} 
            className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:via-rose-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            <i className="ri-chat-3-line ml-2 text-xl"></i>
            شروع چت با {caseData?.name?.split(' - ')[0] || 'کیس'}
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 text-center"
          >
            <i className="ri-home-4-line ml-2"></i>
            بازگشت به خانه
          </button>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center text-blue-700">
            <i className="ri-shield-check-line text-lg ml-2"></i>
            <span className="text-sm font-medium">اطلاعات شما محافظت شده و امن است</span>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}