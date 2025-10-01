
import { useState, useEffect } from 'react';
import { systemAPI } from '../../../../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminCredentials {
  username: string;
  password: string;
}

interface SystemConfig {
  telegramBotToken: string;
  telegramChatId: string;
  paymentGatewayUrl: string;
  defaultFeeAmount: number;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'system'>('admin');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    username: 'admin',
    password: 'admin123'
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    telegramBotToken: '',
    telegramChatId: '',
    paymentGatewayUrl: 'https://payment.example.com',
    defaultFeeAmount: 250000
  });

  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      testSupabaseConnection();
    }
  }, [isOpen]);

  const testSupabaseConnection = async () => {
    setTestingConnection(true);
    try {
      console.log('🔄 تست اتصال قوی‌تر به Supabase...');
      
      // تست مستقیم اتصال
      const connectionTest = await systemAPI.testConnection();
      if (connectionTest) {
        console.log('✅ اتصال پایه موفق');
        
        // تست دریافت تنظیمات
        const config = await systemAPI.getConfig();
        if (config) {
          console.log('✅ دریافت تنظیمات موفق:', config);
          setConnectionStatus('connected');
        } else {
          console.log('⚠️ اتصال موفق اما رکورد اولیه نیاز است');
          
          // ایجاد رکورد اولیه
          const initialConfig = {
            telegram_bot_token: '',
            telegram_chat_id: '',
            payment_gateway_url: 'https://payment.example.com',
            default_fee_amount: 250000
          };
          
          const createResult = await systemAPI.updateConfig(initialConfig);
          if (createResult) {
            console.log('✅ رکورد اولیه ایجاد شد');
            setConnectionStatus('connected');
          } else {
            throw new Error('خطا در ایجاد رکورد اولیه');
          }
        }
      } else {
        throw new Error('تست اتصال ناموفق');
      }
    } catch (error) {
      console.error('❌ خطا در تست اتصال:', error);
      setConnectionStatus('error');
      
      // تلاش مجدد یکبار دیگر
      setTimeout(async () => {
        try {
          const retryTest = await systemAPI.testConnection();
          if (retryTest) {
            setConnectionStatus('connected');
            console.log('✅ تلاش مجدد موفق بود');
          }
        } catch (retryError) {
          console.error('❌ تلاش مجدد نیز ناموفق:', retryError);
        }
      }, 2000);
    } finally {
      setTestingConnection(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    
    // بارگذاری اعتبارسنجی ادمین از LocalStorage
    const savedCredentials = localStorage.getItem('adminCredentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        setAdminCredentials(credentials);
      } catch (error) {
        console.error('خطا در بارگذاری اعتبارسنجی:', error);
      }
    }

    // بارگذاری تنظیمات سیستم از Supabase با تلاش‌های متعدد
    try {
      console.log('📡 شروع بارگذاری تنظیمات از Supabase...');
      
      let supabaseConfig = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!supabaseConfig && attempts < maxAttempts) {
        attempts++;
        console.log(`📡 تلاش ${attempts} از ${maxAttempts}...`);
        
        try {
          supabaseConfig = await systemAPI.getConfig();
          
          if (supabaseConfig) {
            console.log('✅ تنظیمات دریافت شد:', supabaseConfig);
            break;
          } else if (attempts === 1) {
            // تلاش برای ایجاد رکورد اولیه در اولین بار
            console.log('🔧 ایجاد رکورد اولیه...');
            const initialConfig = {
              telegram_bot_token: '',
              telegram_chat_id: '',
              payment_gateway_url: 'https://payment.example.com',
              default_fee_amount: 250000
            };
            
            const createResult = await systemAPI.updateConfig(initialConfig);
            if (createResult) {
              supabaseConfig = createResult;
              console.log('✅ رکورد اولیه ایجاد و دریافت شد');
              break;
            }
          }
        } catch (attemptError) {
          console.warn(`⚠️ تلاش ${attempts} ناموفق:`, attemptError);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }
      
      if (supabaseConfig) {
        setSystemConfig({
          telegramBotToken: supabaseConfig.telegram_bot_token || '',
          telegramChatId: supabaseConfig.telegram_chat_id || '',
          paymentGatewayUrl: supabaseConfig.payment_gateway_url || 'https://payment.example.com',
          defaultFeeAmount: supabaseConfig.default_fee_amount || 250000
        });
        console.log('✅ تنظیمات سیستم بارگذاری شد');
        setConnectionStatus('connected');
      } else {
        throw new Error('ناتوانی در دریافت یا ایجاد تنظیمات');
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری تنظیمات سیستم:', error);
      setConnectionStatus('error');
      
      // بکاپ از LocalStorage
      const localConfig = localStorage.getItem('systemConfig');
      if (localConfig) {
        try {
          const parsedConfig = JSON.parse(localConfig);
          setSystemConfig({
            telegramBotToken: parsedConfig.telegramBotToken || '',
            telegramChatId: parsedConfig.telegramChatId || '',
            paymentGatewayUrl: parsedConfig.paymentGatewayUrl || 'https://payment.example.com',
            defaultFeeAmount: parsedConfig.defaultFeeAmount || 250000
          });
          console.log('⚠️ تنظیمات از LocalStorage بارگذاری شد');
        } catch (localError) {
          console.error('❌ خطا در بارگذاری LocalStorage:', localError);
        }
      }
    }
    
    setLoading(false);
  };

  const handleAdminCredentialsChange = (field: keyof AdminCredentials, value: string) => {
    setAdminCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSystemConfigChange = (field: keyof SystemConfig, value: string | number) => {
    setSystemConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveAdminCredentials = () => {
    if (!adminCredentials.username.trim() || !adminCredentials.password.trim()) {
      alert('نام کاربری و رمز عبور نمی‌تواند خالی باشد');
      return;
    }

    if (adminCredentials.password.length < 4) {
      alert('رمز عبور باید حداقل ۴ کاراکتر باشد');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      localStorage.setItem('adminCredentials', JSON.stringify(adminCredentials));
      setLoading(false);
      alert('✅ اعتبارسنجی ادمین با موفقیت تغییر کرد');
    }, 1000);
  };

  const saveSystemConfig = async () => {
    // اعتبارسنجی دقیق‌تر
    if (systemConfig.paymentGatewayUrl && !systemConfig.paymentGatewayUrl.startsWith('http') && systemConfig.paymentGatewayUrl.trim() !== '') {
      alert('لینک درگاه پرداخت باید با http:// یا https:// شروع شود');
      return;
    }

    if (systemConfig.defaultFeeAmount < 1000) {
      alert('مبلغ پیش‌فرض باید حداقل ۱۰۰۰ تومان باشد');
      return;
    }

    // اعتبارسنجی Chat ID تلگرام با regex دقیق‌تر
    if (systemConfig.telegramChatId && !systemConfig.telegramChatId.match(/^-?\d+$/)) {
      alert('Chat ID باید فقط شامل اعداد باشد (مثال: 6498549652 یا -1001234567890)');
      return;
    }

    // اعتبارسنجی توکن تلگرام
    if (systemConfig.telegramBotToken && !systemConfig.telegramBotToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      alert('فرمت توکن ربات صحیح نیست. باید به شکل: 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 باشد');
      return;
    }

    // پاک‌سازی داده‌ها
    const cleanToken = systemConfig.telegramBotToken.trim().replace(/[^\w:-]/g, '');
    const cleanChatId = systemConfig.telegramChatId.trim().replace(/[^\d-]/g, '');

    setSaveStatus('saving');
    setLoading(true);
    
    try {
      console.log('💾 شروع ذخیره تنظیمات در Supabase...');
      
      const configToSave = {
        telegram_bot_token: cleanToken,
        telegram_chat_id: cleanChatId,
        payment_gateway_url: systemConfig.paymentGatewayUrl.trim(),
        default_fee_amount: systemConfig.defaultFeeAmount
      };

      console.log('📤 داده‌های ارسالی به Supabase:', configToSave);
      
      // تلاش‌های متعدد برای ذخیره
      let result = null;
      let saveAttempts = 0;
      const maxSaveAttempts = 5;
      
      while (!result && saveAttempts < maxSaveAttempts) {
        saveAttempts++;
        console.log(`💾 تلاش ذخیره ${saveAttempts} از ${maxSaveAttempts}...`);
        
        try {
          // تست اتصال قبل از ذخیره
          const connectionTest = await systemAPI.testConnection();
          if (!connectionTest) {
            throw new Error('اتصال به دیتابیس برقرار نیست');
          }
          
          result = await systemAPI.updateConfig(configToSave);
          
          if (result) {
            console.log('✅ ذخیره موفق در تلاش', saveAttempts);
            break;
          } else {
            throw new Error(`تلاش ${saveAttempts}: نتیجه null`);
          }
        } catch (saveError) {
          console.error(`❌ تلاش ${saveAttempts} ناموفق:`, saveError);
          
          if (saveAttempts < maxSaveAttempts) {
            console.log(`⏳ انتظار ${saveAttempts * 2} ثانیه قبل از تلاش مجدد...`);
            await new Promise(resolve => setTimeout(resolve, saveAttempts * 2000));
          }
        }
      }
      
      if (result) {
        console.log('✅ تنظیمات با موفقیت در Supabase ذخیره شد:', result);
        
        // بروزرسانی state با داده‌های تمیز شده
        setSystemConfig(prev => ({
          ...prev,
          telegramBotToken: cleanToken,
          telegramChatId: cleanChatId
        }));
        
        // بکاپ در LocalStorage
        const localConfig = {
          telegramBotToken: cleanToken,
          telegramChatId: cleanChatId,
          paymentGatewayUrl: systemConfig.paymentGatewayUrl.trim(),
          defaultFeeAmount: systemConfig.defaultFeeAmount
        };
        localStorage.setItem('systemConfig', JSON.stringify(localConfig));
        
        setSaveStatus('success');
        setConnectionStatus('connected');
        
        // پیام موفقیت کامل
        setTimeout(() => {
          alert(`🎉 تنظیمات سیستم با موفقیت در دیتابیس جهانی ذخیره شدند!

📊 تنظیمات ذخیره شده:
🤖 Bot Token: ${cleanToken ? '✅ تنظیم شد' : '❌ خالی'}
💬 Chat ID: ${cleanChatId ? '✅ تنظیم شد' : '❌ خالی'}  
💰 مبلغ پیش‌فرض: ${systemConfig.defaultFeeAmount.toLocaleString()} تومان
🔗 درگاه پرداخت: ${systemConfig.paymentGatewayUrl}

🌍 این تنظیمات اکنون در تمام قسمت‌های سیستم (ثبت آگهی، چت، پرداخت) فعال است!
📨 پیام‌ها به تلگرام ارسال خواهند شد! 🚀

✅ اتصال دیتابیس: موفق و پایدار (${saveAttempts} تلاش)`);
        }, 500);
        
      } else {
        throw new Error(`تمام ${maxSaveAttempts} تلاش ناموفق بود`);
      }
    } catch (error) {
      console.error('❌ خطا در ذخیره تنظیمات:', error);
      setSaveStatus('error');
      setConnectionStatus('error');
      
      // پیام خطای دقیق‌تر
      alert(`❌ خطا در ذخیره تنظیمات در دیتابیس جهانی!

🔍 جزئیات خطا: ${error}

💡 راهکارهای پیشنهادی:
1. اتصال اینترنت را بررسی کنید
2. اطلاعات Supabase را کنترل کنید  
3. مجدداً تلاش کنید
4. ممکن است جدول system_config در دیتابیس وجود نداشته باشد
5. RLS policies ممکن است درست تنظیم نشده باشند

⚠️ تنظیمات در حافظه محلی ذخیره شدند تا مشکل برطرف شود.

🔧 لطفاً با پشتیبانی تماس بگیرید تا ساختار دیتابیس بررسی شود.`);
      
      // ذخیره اضطراری در LocalStorage
      const localConfig = {
        telegramBotToken: cleanToken,
        telegramChatId: cleanChatId,
        paymentGatewayUrl: systemConfig.paymentGatewayUrl.trim(),
        defaultFeeAmount: systemConfig.defaultFeeAmount
      };
      localStorage.setItem('systemConfig', JSON.stringify(localConfig));
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-settings-3-line text-2xl ml-3"></i>
              <h2 className="text-xl font-bold">تنظیمات پنل ادمین</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>

          {/* Connection Status - بهبود یافته */}
          <div className="mt-4 p-3 bg-white/10 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm">وضعیت اتصال دیتابیس جهانی:</span>
              <div className="flex items-center">
                {testingConnection ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    <span className="text-sm">در حال تست...</span>
                  </div>
                ) : connectionStatus === 'connected' ? (
                  <div className="flex items-center text-green-200">
                    <i className="ri-check-line ml-1"></i>
                    <span className="text-sm">متصل و آماده</span>
                  </div>
                ) : connectionStatus === 'error' ? (
                  <div className="flex items-center text-red-200">
                    <i className="ri-close-line ml-1"></i>
                    <span className="text-sm">خطا در اتصال</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-200">
                    <i className="ri-question-line ml-1"></i>
                    <span className="text-sm">در حال بررسی...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className="mt-2 p-2 bg-white/10 rounded-lg">
              <div className="flex items-center justify-center text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    در حال ذخیره در دیتابیس...
                  </>
                )}
                {saveStatus === 'success' && (
                  <>
                    <i className="ri-check-line text-green-200 ml-2"></i>
                    ذخیره موفق در دیتابیس جهانی!
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <i className="ri-error-warning-line text-red-200 ml-2"></i>
                    خطا در ذخیره - لطفاً مجدداً تلاش کنید
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 rtl:space-x-reverse mt-4">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'admin'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              اعتبارسنجی ادمین
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'system'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              تنظیمات سیستم جهانی
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && activeTab === 'system' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">در حال بارگذاری از دیتابیس جهانی...</p>
            </div>
          )}

          {!loading && activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <i className="ri-shield-keyhole-line text-yellow-600 text-lg ml-2"></i>
                  <div className="text-yellow-800 text-sm">
                    <p className="font-semibold">تغییر اعتبارسنجی ادمین</p>
                    <p>با تغییر این اطلاعات، اعتبارسنجی فعلی شما نیز تغییر خواهد کرد</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  نام کاربری جدید
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => handleAdminCredentialsChange('username', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="نام کاربری"
                  />
                  <i className="ri-admin-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => handleAdminCredentialsChange('password', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="رمز عبور (حداقل ۴ کاراکتر)"
                    minLength={4}
                  />
                  <i className="ri-lock-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              <button
                onClick={saveAdminCredentials}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    در حال ذخیره...
                  </div>
                ) : (
                  <>
                    <i className="ri-save-line ml-2"></i>
                    ذخیره تغییرات
                  </>
                )}
              </button>
            </div>
          )}

          {!loading && activeTab === 'system' && (
            <div className="space-y-6">
              <div className={`border rounded-2xl p-4 ${
                connectionStatus === 'connected' 
                  ? 'bg-green-50 border-green-200' 
                  : connectionStatus === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center">
                  <i className={`text-lg ml-2 ${
                    connectionStatus === 'connected' 
                      ? 'ri-database-2-line text-green-600' 
                      : connectionStatus === 'error'
                      ? 'ri-error-warning-line text-red-600'
                      : 'ri-loader-4-line text-yellow-600'
                  }`}></i>
                  <div className={`text-sm ${
                    connectionStatus === 'connected' 
                      ? 'text-green-800' 
                      : connectionStatus === 'error'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}>
                    <p className="font-semibold">
                      {connectionStatus === 'connected' 
                        ? '🌍 دیتابیس جهانی Supabase متصل و آماده' 
                        : connectionStatus === 'error'
                        ? '❌ خطا در اتصال به دیتابیس جهانی'
                        : '🔄 در حال بررسی اتصال...'
                      }
                    </p>
                    <p>
                      {connectionStatus === 'connected' 
                        ? 'تنظیمات به صورت جهانی و امن ذخیره می‌شوند' 
                        : connectionStatus === 'error'
                        ? 'ممکن است جدول system_config وجود نداشته باشد یا RLS تنظیم نشده باشد'
                        : 'لطفاً منتظر بمانید...'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  🤖 توکن ربات تلگرام
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={systemConfig.telegramBotToken}
                    onChange={(e) => handleSystemConfigChange('telegramBotToken', e.target.value.trim())}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                  <i className="ri-telegram-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  ⚠️ فرمت: عدد + : + حروف و اعداد (از @BotFather دریافت کنید)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  💬 Chat ID تلگرام (عددی)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={systemConfig.telegramChatId}
                    onChange={(e) => handleSystemConfigChange('telegramChatId', e.target.value.trim().replace(/[^\d-]/g, ''))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="6498549652"
                  />
                  <i className="ri-chat-3-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  💡 فقط اعداد (از @userinfobot دریافت کنید)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  🔗 لینک درگاه پرداخت حق‌المعارف
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={systemConfig.paymentGatewayUrl}
                    onChange={(e) => handleSystemConfigChange('paymentGatewayUrl', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="https://payment.example.com"
                  />
                  <i className="ri-bank-card-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  💰 قیمت حق‌المعارف پیش‌فرض (تومان)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={systemConfig.defaultFeeAmount}
                    onChange={(e) => handleSystemConfigChange('defaultFeeAmount', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="250000"
                    min="1000"
                  />
                  <i className="ri-money-dollar-circle-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  💡 این مبلغ در تمام بخش‌های سیستم (ثبت آگهی، چت، پرداخت) اعمال می‌شود
                </p>
              </div>

              <button
                onClick={saveSystemConfig}
                disabled={loading || saveStatus === 'saving'}
                className={`w-full font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 text-lg ${
                  loading || saveStatus === 'saving'
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : saveStatus === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white'
                }`}
              >
                {loading || saveStatus === 'saving' ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    در حال ذخیره در دیتابیس جهانی...
                  </div>
                ) : saveStatus === 'success' ? (
                  <>
                    <i className="ri-check-double-line ml-2"></i>
                    ✅ ذخیره موفق در دیتابیس جهانی
                  </>
                ) : (
                  <>
                    <i className="ri-database-2-line ml-2"></i>
                    💾 ذخیره جهانی در دیتابیس Supabase
                  </>
                )}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 text-lg ml-2 mt-0.5"></i>
                  <div className="text-blue-800 text-sm">
                    <p className="font-semibold mb-1">🌍 راهنمای تنظیمات جهانی:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• توکن ربات از @BotFather دریافت کنید</li>
                      <li>• Chat ID را از @userinfobot بگیرید</li>
                      <li>• 🔥 تنظیمات در تمام بخش‌های سیستم فعال می‌شوند</li>
                      <li>• 🌐 ثبت آگهی، چت، پرداخت همگی از این تنظیمات استفاده می‌کنند</li>
                      <li>• پس از ذخیره، پیام‌ها به تلگرام ارسال خواهند شد</li>
                      <li>• کاراکترهای اضافی خودکار حذف می‌شوند</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
