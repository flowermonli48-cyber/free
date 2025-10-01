
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';
import { casesAPI, type CaseData } from '../../lib/supabase';

// استان‌های اصلی ایران
const iranProvinces = [
  'تهران', 'اصفهان', 'خراسان رضوی', 'خوزستان', 'فارس', 'آذربایجان شرقی', 
  'مازندران', 'گیلان', 'کرمان', 'البرز', 'سیستان و بلوچستان', 'هرمزگان',
  'همدان', 'زنجان', 'یزد', 'اردبیل', 'لرستان', 'مرکزی', 'ایلام', 'بوشهر',
  'کردستان', 'آذربایجان غربی', 'قم', 'قزوین', 'گلستان', 'چهارمحال و بختیاری',
  'خراسان شمالی', 'خراسان جنوبی', 'کهگیلویه و بویراحمد', 'سمنان', 'کرمانشاه'
];

// شهرهای اصلی هر استان (کاهش یافته)
const provinceCities: { [key: string]: string[] } = {
  'تهران': ['تهران', 'ری', 'شهریار', 'ورامین', 'اسلام‌شهر', 'قدس', 'پردیس', 'رباط‌کریم'],
  'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'مبارکه', 'شهرضا', 'فولادشهر'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان', 'کاشمر', 'تایباد', 'چناران'],
  'خوزستان': ['اهواز', 'آبادان', 'خرمشهر', 'اندیمشک', 'ماهشهر', 'دزفول', 'شوشتر', 'بهبهان'],
  'فارس': ['شیراز', 'کازرون', 'فسا', 'مرودشت', 'جهرم', 'لار', 'نی‌ریز', 'آباده'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'میانه', 'مرند', 'بناب', 'شبستر', 'اهر', 'سراب'],
  'مازندران': ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'بهشهر', 'رامسر', 'چالوس', 'نوشهر'],
  'گیلان': ['رشت', 'انزلی', 'لاهیجان', 'تالش', 'لنگرود', 'فومن', 'صومعه‌سرا', 'آستارا'],
  'کرمان': ['کرمان', 'رفسنجان', 'سیرجان', 'جیرفت', 'زرند', 'بم', 'کهنوج', 'شهربابک'],
  'البرز': ['کرج', 'فردیس', 'طالقان', 'ساوجبلاغ', 'نظرآباد', 'هشتگرد', 'محمدشهر', 'مهرشهر']
};

export default function Services() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showProvinceSearch, setShowProvinceSearch] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [provinceSearchTerm, setProvinceSearchTerm] = useState('');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    
    try {
      const activeCases = await casesAPI.getActive();
      setCases(activeCases);
      setFilteredCases(activeCases);
      console.log(`✅ ${activeCases.length} آگهی از دیتابیس بارگذاری شد`);
    } catch (error) {
      console.error('❌ خطا در بارگذاری آگهی‌ها:', error);
      setCases([]);
      setFilteredCases([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    let filtered = cases.filter(caseItem => {
      const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesLocation = true;
      if (selectedProvince) {
        matchesLocation = caseItem.location === selectedProvince;
      }
      
      return matchesSearch && matchesLocation;
    });

    // Sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'age-young':
          return (a.age || 25) - (b.age || 25);
        case 'age-old':
          return (b.age || 25) - (a.age || 25);
        default:
          return 0;
      }
    });

    setFilteredCases(filtered);
  }, [cases, searchTerm, selectedProvince, sortBy]);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity('');
    setShowProvinceSearch(false);
    setShowCitySearch(true);
    setProvinceSearchTerm('');
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCitySearch(false);
  };

  const clearLocationFilter = () => {
    setSelectedCity('');
    setSelectedProvince('');
  };

  const filteredProvinces = iranProvinces.filter(province => 
    province.toLowerCase().includes(provinceSearchTerm.toLowerCase())
  );

  const availableCities = selectedProvince ? (provinceCities[selectedProvince] || []) : [];

  const addToFavorites = (caseData: CaseData) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoritesCases') || '[]');
      
      if (!favorites.find((fav: any) => fav.id === caseData.id)) {
        const favoriteCase = {
          ...caseData,
          addedAt: new Date().toISOString()
        };
        
        favorites.push(favoriteCase);
        localStorage.setItem('favoritesCases', JSON.stringify(favorites));
        
        alert('✅ کیس به علاقه‌مندی‌ها اضافه شد!');
      } else {
        alert('این کیس قبلاً به علاقه‌مندی‌ها اضافه شده است');
      }
    } catch (error) {
      console.error('خطا در اضافه کردن به علاقه‌مندی‌ها:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100">
      <NavBar title="خدمات" showBack={true} />

      <div className="pt-20 pb-20">
        {/* Search and Filters */}
        <div className="px-4 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، توضیحات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/95 backdrop-blur-sm border-none rounded-2xl px-5 py-4 pr-12 text-gray-700 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
          </div>

          {/* Location Search Button */}
          <button
            onClick={() => setShowProvinceSearch(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl px-4 py-4 shadow-lg flex items-center justify-center mb-4 transition-colors"
          >
            <i className="ri-map-pin-line text-white mr-2"></i>
            <span className="font-medium">
              {selectedCity && selectedProvince ? 
                `${selectedCity} (${selectedProvince})` : 
                selectedProvince ? 
                  selectedProvince : 
                  'انتخاب استان و شهر'
              }
            </span>
            <i className="ri-arrow-down-s-line text-white mr-2"></i>
          </button>

          {/* Clear Location Filter */}
          {(selectedCity || selectedProvince) && (
            <button
              onClick={clearLocationFilter}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-xl px-4 py-2 mb-4 text-sm"
            >
              <i className="ri-close-line mr-1"></i>
              حذف فیلتر مکان
            </button>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center justify-center mb-4 hover:bg-white transition-colors"
          >
            <i className="ri-filter-line text-gray-600 mr-2"></i>
            <span className="text-gray-700 font-medium">فیلترهای پیشرفته</span>
            <i className={`ri-arrow-${showFilters ? 'up' : 'down'}-s-line text-gray-600 mr-2 transition-transform`}></i>
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-4 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">مرتب‌سازی بر اساس</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="oldest">قدیمی‌ترین</option>
                  <option value="price-high">گران‌ترین</option>
                  <option value="price-low">ارزان‌ترین</option>
                  <option value="age-young">جوان‌ترین</option>
                  <option value="age-old">مسن‌ترین</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Province Search Modal */}
        {showProvinceSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-96 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">انتخاب استان</h3>
                <button 
                  onClick={() => setShowProvinceSearch(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              
              {/* Search Input */}
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="جستجو در استان‌ها..."
                  value={provinceSearchTerm}
                  onChange={(e) => setProvinceSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {filteredProvinces.map((province) => (
                    <button
                      key={province}
                      onClick={() => handleProvinceSelect(province)}
                      className="text-right bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-4 py-3 rounded-xl text-sm transition-colors flex items-center"
                    >
                      <i className="ri-map-pin-line ml-2 text-blue-500"></i>
                      {province}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* City Search Modal */}
        {showCitySearch && selectedProvince && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-96 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">شهرهای {selectedProvince}</h3>
                <button 
                  onClick={() => setShowCitySearch(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              
              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className="text-right bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 px-3 py-2 rounded-xl text-sm transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cases Grid */}
        <div className="px-4">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="ri-search-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">آگهی‌ای یافت نشد</h3>
              <p className="text-gray-600 leading-relaxed">
                {cases.length === 0 ? 
                  'هیچ آگهی فعالی وجود ندارد' : 
                  selectedCity ? 
                    `آگهی‌ای در شهر ${selectedCity} یافت نشد` :
                    'با فیلترهای انتخابی آگهی‌ای یافت نشد'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCases.map((caseItem) => (
                <div 
                  key={caseItem.id}
                  className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={caseItem.image}
                      alt={caseItem.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {caseItem.verified && (
                        <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <i className="ri-verified-badge-fill mr-1"></i>
                          تایید شده
                        </span>
                      )}
                      {caseItem.online && (
                        <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <i className="ri-circle-fill mr-1 text-xs"></i>
                          آنلاین
                        </span>
                      )}
                      {caseItem.is_persistent && (
                        <span className="bg-purple-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <i className="ri-bookmark-fill mr-1 text-xs"></i>
                          دائمی
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToFavorites(caseItem);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <i className="ri-heart-line text-gray-600 hover:text-red-500"></i>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2">
                      {caseItem.name}
                    </h3>

                    {/* Details */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-gray-600 text-xs">
                        <i className="ri-map-pin-line mr-1"></i>
                        <span>
                          {selectedCity || caseItem.location}
                        </span>
                        {caseItem.age && <span className="mr-2">• {caseItem.age} ساله</span>}
                      </div>
                      
                      {caseItem.height && (
                        <div className="flex items-center text-gray-600 text-xs">
                          <i className="ri-ruler-line mr-1"></i>
                          <span>{caseItem.height}</span>
                          {caseItem.skin_color && <span className="mr-2">• {caseItem.skin_color}</span>}
                        </div>
                      )}

                      {caseItem.experience_level && (
                        <div className="flex items-center text-gray-600 text-xs">
                          <i className="ri-star-line mr-1"></i>
                          <span>{caseItem.experience_level}</span>
                        </div>
                      )}
                    </div>

                    {/* Personality Traits */}
                    {caseItem.personality_traits && caseItem.personality_traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {caseItem.personality_traits.slice(0, 2).map((trait, index) => (
                          <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {trait}
                          </span>
                        ))}
                        {caseItem.personality_traits.length > 2 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            +{caseItem.personality_traits.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {caseItem.price && caseItem.price > 0 && (
                          <div className="text-red-500 text-xs line-through opacity-75">
                            {new Intl.NumberFormat('fa-IR').format(caseItem.price)} ت
                          </div>
                        )}
                        <div className="text-green-600 font-bold text-xs">
                          🎁 2 ارتباط اول رایگان
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/case-details/${caseItem.id}`)}
                        className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all duration-300"
                      >
                        مشاهده
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TabBar />
    </div>
  );
}
