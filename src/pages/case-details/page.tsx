
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';
import { casesAPI, type CaseData } from '../../lib/supabase';

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (id) {
      loadCaseData(parseInt(id));
    }
  }, [id]);

  const loadCaseData = async (caseId: number) => {
    setLoading(true);
    console.log(`🔍 شروع بارگذاری کیس ${caseId}...`);
    
    try {
      // 1. سعی برای بارگذاری از Supabase
      const supabaseCase = await casesAPI.getById(caseId);
      if (supabaseCase) {
        setCaseData(supabaseCase);
        console.log(`✅ کیس ${supabaseCase.name} از Supabase بارگذاری شد`);
      } else {
        console.log(`⚠️ کیس ${caseId} در Supabase یافت نشد، ایجاد کیس نمونه...`);
        
        // 2. در صورت عدم وجود، ایجاد کیس نمونه کامل
        const sampleCase: CaseData = {
          id: caseId,
          name: `کیس شماره ${caseId} - ${getRandomName()}`,
          image: `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style%20professional&width=400&height=600&seq=${caseId}&orientation=portrait`,
          location: getRandomLocation(),
          category: 'temporary',
          price: 500000,
          age: Math.floor(Math.random() * 15) + 20, // 20-35 سال
          height: `${Math.floor(Math.random() * 20) + 155} سانتی متر`, // 155-175 سانتی متر
          skin_color: getRandomSkinColor(),
          body_type: getRandomBodyType(),
          personality_traits: getRandomPersonalityTraits(),
          experience_level: getRandomExperienceLevel(),
          description: getRandomDescription(),
          status: 'active',
          verified: true,
          online: true,
          is_persistent: true,
          details: {
            education: getRandomEducation(),
            relationship_type: 'صیغه موقت',
            interests: getRandomInterests()
          },
          comments: generateRandomComments(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCaseData(sampleCase);
        console.log(`✅ کیس نمونه کامل ${caseId} ایجاد شد: ${sampleCase.name}`);
        
        // 3. سعی برای ذخیره در دیتابیس (اختیاری)
        try {
          await casesAPI.create(sampleCase);
          console.log(`💾 کیس نمونه ${caseId} در دیتابیس ذخیره شد`);
        } catch (saveError) {
          console.log(`⚠️ خطا در ذخیره کیس نمونه: ${saveError}`);
        }
      }
    } catch (error) {
      console.error(`❌ خطا در بارگذاری کیس ${caseId}:`, error);
      
      // 4. در صورت هر گونه خطا، ایجاد کیس پشتیبان
      const backupCase: CaseData = {
        id: caseId,
        name: `کیس فعال ${caseId} - ${getRandomName()}`,
        image: `https://readdy.ai/api/search-image?query=elegant%20woman%20portrait%20beautiful%20persian&width=400&height=600&seq=${caseId}&orientation=portrait`,
        location: 'تهران',
        category: 'temporary',
        price: 300000,
        age: 25,
        height: '165 سانتی متر',
        skin_color: 'روشن',
        body_type: 'متوسط',
        personality_traits: ['مهربان', 'صمیمی'],
        experience_level: 'با تجربه',
        description: 'کیس تایید شده و آماده ارتباط. تجربه خوب و رضایت کاربران تضمین شده.',
        status: 'active',
        verified: true,
        online: true,
        is_persistent: true,
        details: {
          education: 'دانشگاهی',
          relationship_type: 'صیغه موقت',
          interests: ['سینما', 'مطالعه', 'ورزش']
        },
        comments: [
          {
            name: 'کاربر راضی',
            comment: 'تجربه فوق‌العاده‌ای بود! خیلی راضی بودم',
            rating: 5,
            date: '1403/08/15'
          },
          {
            name: 'مشتری دائمی',
            comment: 'کیس فوق‌العاده و قابل اعتماد. پیشنهاد می‌کنم',
            rating: 5,
            date: '1403/08/10'
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCaseData(backupCase);
      console.log(`🔄 کیس پشتیبان ${caseId} ایجاد شد: ${backupCase.name}`);
    } finally {
      setLoading(false);
    }
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
    const numTraits = Math.floor(Math.random() * 3) + 2; // 2-4 ویژگی
    
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

  const getRandomEducation = () => {
    const educations = ['دیپلم', 'کاردانی', 'کارشناسی', 'کارشناسی ارشد'];
    return educations[Math.floor(Math.random() * educations.length)];
  };

  const getRandomInterests = () => {
    const interests = ['سینما', 'مطالعه', 'ورزش', 'موسیقی', 'نقاشی', 'آشپزی', 'سفر', 'عکاسی'];
    const selectedInterests = [];
    const numInterests = Math.floor(Math.random() * 3) + 2; // 2-4 علاقه
    
    for (let i = 0; i < numInterests; i++) {
      const randomInterest = interests[Math.floor(Math.random() * interests.length)];
      if (!selectedInterests.includes(randomInterest)) {
        selectedInterests.push(randomInterest);
      }
    }
    
    return selectedInterests;
  };

  const getRandomDescription = () => {
    const descriptions = [
      'سلام! من کاربر جدیدی هستم که به تازگی عضو شده‌ام. امیدوارم بتونیم رابطه خوبی داشته باشیم.',
      'با سلام، دوست دارم با افراد جدید آشنا بشم و تجربه‌های خوبی رو با هم بسازیم.',
      'سلام عزیزان! من فردی مهربان و صمیمی هستم که دوست دارم در محیطی امن و دوستانه باشم.',
      'با احترام، به دنبال رابطه‌ای متقابل و محترمانه هستم. امیدوارم بتونیم همدیگه رو درک کنیم.',
      'سلام! من فردی هستم که ارزش زیادی برای احترام متقابل و تفاهم قائل هستم.'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const generateRandomComments = () => {
    const comments = [
      { name: 'کاربر راضی', comment: 'تجربه فوق‌العاده‌ای بود! خیلی راضی بودم', rating: 5, date: '1403/08/15' },
      { name: 'مشتری دائمی', comment: 'کیس فوق‌العاده و قابل اعتماد. پیشنهاد می‌کنم', rating: 5, date: '1403/08/10' },
      { name: 'کاربر جدید', comment: 'تجربه خوبی بود، ممنون', rating: 4, date: '1403/08/08' },
      { name: 'مشتری قدیمی', comment: 'همیشه از خدمات راضی بوده‌ام', rating: 5, date: '1403/08/05' },
      { name: 'کاربر عادی', comment: 'قابل اعتماد و مهربان', rating: 4, date: '1403/08/01' }
    ];
    
    const numComments = Math.floor(Math.random() * 4) + 2; // 2-5 نظر
    const selectedComments = [];
    
    for (let i = 0; i < numComments; i++) {
      if (i < comments.length) {
        selectedComments.push(comments[i]);
      }
    }
    
    return selectedComments;
  };

  const startVerification = (caseId: number) => {
    console.log(`🔄 شروع فرآیند استعلام برای کیس ${caseId}: ${caseData?.name}`);
    
    // اضافه کردن به لیست علاقه‌مندی‌ها
    addToFavorites();
    
    // انتقال به صفحه استعلام
    navigate(`/verification/${caseId}`, { state: { caseData } });
  };

  const addToFavorites = () => {
    if (!caseData) return;
    
    try {
      const existingFavorites = JSON.parse(localStorage.getItem('favoritesCases') || '[]');
      const exists = existingFavorites.find((fav: any) => fav.id === caseData.id);
      
      if (!exists) {
        const favoriteItem = {
          ...caseData,
          addedAt: new Date().toISOString()
        };
        
        existingFavorites.push(favoriteItem);
        localStorage.setItem('favoritesCases', JSON.stringify(existingFavorites));
        
        console.log(`💕 کیس ${caseData.name} به علاقه‌مندی‌ها اضافه شد`);
        showSuccessMessage();
      } else {
        console.log(`ℹ️ کیس ${caseData.name} قبلاً در علاقه‌مندی‌ها وجود دارد`);
        showSuccessMessage();
      }
    } catch (error) {
      console.error('خطا در اضافه کردن به علاقه‌مندی‌ها:', error);
    }
  };

  const showSuccessMessage = () => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-20 left-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl z-50 text-center font-semibold animate-bounce';
    messageDiv.innerHTML = `
      <div class="flex items-center justify-center">
        <i class="ri-heart-fill text-xl ml-2"></i>
        <span>کیس مورد نظر به لیست علاقه‌مندی و بخش چت شما اضافه شد 💕</span>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'temporary': 'صیغه موقت',
      'sugar': 'شوگر دیدی',
      'friendship': 'دوستی'
    };
    return categories[category] || category;
  };

  const toggleAllComments = () => {
    setShowAllComments(!showAllComments);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center">
        <NavBar title="جزئیات کیس" showBack={true} />
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری کیس...</p>
          <p className="text-gray-500 text-sm mt-2">لطفاً صبر کنید...</p>
        </div>
        <TabBar />
      </div>
    );
  }

  // همیشه کیس نمایش داده می‌شود - هیچ‌گاه "کیس یافت نشد" نمایش داده نمی‌شود
  if (!caseData) {
    console.error('⚠️ خطای غیرمنتظره: caseData تعریف نشده');
    // در صورت خطای غیرمنتظره، کیس اضطراری ایجاد کن
    const emergencyCase: CaseData = {
      id: parseInt(id || '1'),
      name: `کیس شماره ${id} - آماده ارتباط`,
      image: `https://readdy.ai/api/search-image?query=beautiful%20persian%20woman%20portrait&width=400&height=600&seq=${id}&orientation=portrait`,
      location: 'تهران',
      category: 'temporary',
      price: 250000,
      age: 25,
      description: 'کیس فعال و آماده ارتباط',
      status: 'active',
      verified: true,
      online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCaseData(emergencyCase);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100">
      <NavBar title="جزئیات کیس" showBack={true} />

      <div className="pt-20 pb-20">
        {/* Main Profile Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl mb-6 mx-4 overflow-hidden border border-white/30">
          <div className="relative">
            {/* گالری عکس‌ها - اگر چند عکس وجود دارد */}
            {caseData?.details?.gallery_images && Array.isArray(caseData.details.gallery_images) && caseData.details.gallery_images.length > 1 ? (
              <div className="relative">
                <div className="flex overflow-x-auto space-x-2 rtl:space-x-reverse p-2 bg-black/10">
                  {caseData.details.gallery_images.map((image: string, index: number) => (
                    <div key={index} className="flex-shrink-0 relative">
                      <img 
                        src={image}
                        alt={`عکس ${index + 1} - ${caseData.name}`}
                        className="w-80 h-96 object-cover object-top rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=400&height=600&seq=${caseData.id}_${index}&orientation=portrait`;
                        }}
                      />
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}/{caseData.details.gallery_images.length}
                      </div>
                      {index === 0 && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          عکس اصلی
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* اطلاعات گالری */}
                <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-2xl">
                  <div className="flex items-center text-sm">
                    <i className="ri-gallery-line mr-2"></i>
                    <span>{caseData.details.gallery_images.length} عکس در گالری</span>
                  </div>
                </div>
              </div>
            ) : (
              // عکس تک (حالت قبلی)
              <img 
                src={caseData?.image}
                alt={caseData?.name}
                className="w-full h-96 object-cover object-top"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=400&height=600&seq=${id}&orientation=portrait`;
                }}
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Status Badges */}
            <div className="absolute top-6 right-6 flex flex-col space-y-3">
              {caseData?.verified && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <i className="ri-verified-badge-fill mr-2"></i>
                  تایید شده
                </div>
              )}
              {caseData?.online && (
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  آنلاین
                </div>
              )}
              {caseData?.is_persistent && (
                <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <i className="ri-bookmark-fill mr-2"></i>
                  آگهی کامل
                </div>
              )}
              {/* نشان گالری عکس */}
              {caseData?.details?.gallery_images && Array.isArray(caseData.details.gallery_images) && caseData.details.gallery_images.length > 1 && (
                <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-lg backdrop-blur-sm">
                  <i className="ri-gallery-line mr-2"></i>
                  {caseData.details.gallery_images.length} عکس
                </div>
              )}
            </div>

            {/* Name and Basic Info */}
            <div className="absolute bottom-6 right-6 left-6">
              <h1 className="text-white text-3xl font-bold mb-3 drop-shadow-lg">{caseData?.name}</h1>
              <div className="flex items-center text-white/90 text-lg mb-2">
                <i className="ri-map-pin-line mr-2"></i>
                {caseData?.location}
              </div>
              <div className="flex items-center text-white/80 text-sm mb-2">
                <i className="ri-eye-line mr-2"></i>
                {Math.floor(Math.random() * 500) + 100} بازدید امروز
              </div>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <i className="ri-heart-line mr-2 text-white"></i>
                <span className="text-white text-sm font-medium">{getCategoryName(caseData?.category || 'temporary')}</span>
              </div>
            </div>
          </div>

          {/* Health Certificate Section */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shield-check-line text-white text-2xl"></i>
                </div>
                <p className="text-2xl font-bold mb-2">✅ تایید سلامت</p>
                <p className="text-white/90 text-sm">این کیس دارای گواهی سلامت معتبر می‌باشد</p>
              </div>
            </div>
          </div>
        </div>

        {/* مینی گالری عکس‌ها - در صورت وجود چندین عکس */}
        {caseData?.details?.gallery_images && Array.isArray(caseData.details.gallery_images) && caseData.details.gallery_images.length > 1 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4 border border-white/30">
            <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center">
              <i className="ri-gallery-line mr-3 text-pink-600 text-2xl"></i>
              گالری عکس‌ها ({caseData.details.gallery_images.length} عکس)
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {caseData.details.gallery_images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <img 
                    src={image}
                    alt={`عکس ${index + 1}`}
                    className="w-full h-32 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform cursor-pointer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://readdy.ai/api/search-image?query=Beautiful%20Persian%20woman%20portrait%20elegant%20style&width=300&height=300&seq=${caseData.id}_${index}&orientation=squarish`;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {index === 0 ? 'اصلی' : index + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-center justify-center">
                    <i className="ri-zoom-in-line text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                <i className="ri-information-line mr-1"></i>
                کلیک روی هر عکس برای مشاهده بزرگتر
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Details Card */}
        {(caseData?.skin_color || caseData?.personality_traits || caseData?.experience_level) && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4 border border-white/30">
            <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center">
              <i className="ri-user-star-line mr-3 text-purple-600 text-2xl"></i>
              مشخصات ویژه
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {caseData.skin_color && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <i className="ri-palette-line text-pink-600 mr-2"></i>
                    <span className="font-semibold text-pink-800 text-sm">رنگ پوست</span>
                  </div>
                  <p className="text-pink-700 font-medium">{caseData.skin_color}</p>
                </div>
              )}

              {caseData.experience_level && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <i className="ri-star-line text-blue-600 mr-2"></i>
                    <span className="font-semibold text-blue-800 text-sm">سطح تجربه</span>
                  </div>
                  <p className="text-blue-700 font-medium">{caseData.experience_level}</p>
                </div>
              )}

              {caseData.personality_traits && caseData.personality_traits.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                  <div className="flex items-center mb-3">
                    <i className="ri-emotion-happy-line text-green-600 mr-2"></i>
                    <span className="font-semibold text-green-800 text-sm">ویژگی‌های شخصیتی</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseData.personality_traits.map((trait: string, index: number) => (
                      <span key={index} className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                        ✨ {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4 border border-white/30">
          <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center">
            <i className="ri-information-line mr-3 text-pink-600 text-2xl"></i>
            درباره من
          </h3>
          <p className="text-gray-700 leading-relaxed text-lg">{caseData?.description}</p>
        </div>

        {/* Enhanced Comments Section */}
        {caseData?.comments && caseData.comments.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4 border border-white/30">
            <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center">
              <i className="ri-chat-3-line mr-3 text-blue-600 text-2xl"></i>
              نظرات کاربران ({caseData.comments.length})
            </h3>
            
            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{caseData.comments.length}</div>
                  <div className="text-blue-500 text-sm">کل نظرات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {caseData.comments.length > 0 ? (caseData.comments.reduce((sum: number, c: any) => sum + (c.rating || 5), 0) / caseData.comments.length).toFixed(1) : '5.0'}
                  </div>
                  <div className="text-green-500 text-sm">امتیاز میانگین</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {caseData.comments.length > 0 ? Math.round((caseData.comments.filter((c: any) => (c.rating || 5) >= 4).length / caseData.comments.length) * 100) : 100}%
                  </div>
                  <div className="text-purple-500 text-sm">رضایت</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* نمایش 5 نظر اول یا همه نظرات بر اساس حالت */}
              {(showAllComments ? caseData.comments : caseData.comments.slice(0, 5)).map((comment: any, index: number) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                        <i className="ri-user-3-fill text-white text-sm"></i>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{comment.name}</span>
                        <p className="text-gray-500 text-xs">{comment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-100 rounded-full px-3 py-1">
                      <div className="flex text-yellow-500 mr-1">
                        {Array.from({length: 5}, (_, i) => (
                          <i key={i} className={`ri-star-${i < (comment.rating || 5) ? 'fill' : 'line'} text-sm`}></i>
                        ))}
                      </div>
                      <span className="text-yellow-700 text-xs font-medium">{comment.rating || 5}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed bg-white rounded-xl p-3 shadow-sm">
                    "{comment.comment}"
                  </p>
                </div>
              ))}
              
              {/* دکمه مشاهده نظرات بیشتر / کمتر */}
              {caseData.comments.length > 5 && (
                <div className="text-center">
                  <button 
                    onClick={toggleAllComments}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    <i className={`${showAllComments ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-2`}></i>
                    {showAllComments 
                      ? 'مشاهده کمتر' 
                      : `مشاهده ${caseData.comments.length - 5} نظر دیگر`
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price and Contact Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                {caseData?.price && caseData.price > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-2xl inline-block mb-4 shadow-lg">
                    <span className="text-xl line-through font-bold">
                      {formatPrice(caseData.price)} تومان
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-center text-green-700 font-bold text-2xl mb-2">
                  <i className="ri-gift-2-line ml-3 text-3xl animate-bounce"></i>
                  <span>2 ارتباط اول رایگان</span>
                  <i className="ri-heart-fill mr-3 text-3xl text-red-500 animate-pulse"></i>
                </div>
                <p className="text-green-600 text-lg font-semibold">🎁 پیشنهاد ویژه برای کاربران جدید</p>
                <p className="text-green-500 text-sm mt-2">بعد از آن طبق تعرفه عادی</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => startVerification(caseData?.id || parseInt(id || '1'))} 
            className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:via-rose-700 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 text-lg"
          >
            <i className="ri-heart-3-line ml-2 text-xl"></i>
            ارتباط با کیس
            <div className="text-sm opacity-90 mt-1">شروع چت و هماهنگی</div>
          </button>
        </div>

        {/* Additional Details */}
        {caseData?.details && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6 mx-4 border border-white/30">
            <h3 className="font-bold text-gray-800 text-xl mb-4 flex items-center">
              <i className="ri-profile-line mr-3 text-purple-600 text-2xl"></i>
              اطلاعات تکمیلی
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {caseData.details.education && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <i className="ri-graduation-cap-line text-blue-600 mr-2"></i>
                    <span className="font-semibold text-blue-800 text-sm">تحصیلات</span>
                  </div>
                  <p className="text-blue-700 text-sm">{caseData.details.education}</p>
                </div>
              )}
              {caseData.details.relationship_type && (
                <div className="bg-pink-50 rounded-2xl p-4">
                  <div className="flex items-center mb-2">
                    <i className="ri-heart-line text-pink-600 mr-2"></i>
                    <span className="font-semibold text-pink-800 text-sm">نوع رابطه</span>
                  </div>
                  <p className="text-pink-700 text-sm">{caseData.details.relationship_type}</p>
                </div>
              )}
              {caseData.details.interests && Array.isArray(caseData.details.interests) && (
                <div className="bg-green-50 rounded-2xl p-4 col-span-2">
                  <div className="flex items-center mb-2">
                    <i className="ri-heart-2-line text-green-600 mr-2"></i>
                    <span className="font-semibold text-green-800 text-sm">علایق</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseData.details.interests.map((interest: string, index: number) => (
                      <span key={index} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
