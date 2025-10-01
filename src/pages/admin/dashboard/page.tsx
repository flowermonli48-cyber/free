
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/base/NavBar';
import TabBar from '../../../components/base/TabBar';
import SettingsModal from './components/SettingsModal';
import { casesAPI, type CaseData } from '../../../lib/supabase';
import {
  generateCompleteCase
} from '../../../data/caseDataBank';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCasesModal, setShowCasesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // فرم آپلود عکس - حالا چندتایی
  const [uploadForm, setUploadForm] = useState({
    images: [] as string[],
    uploading: false
  });

  useEffect(() => {
    checkAdminAuth();
    loadCases();
  }, []);

  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
  };

  const loadCases = async () => {
    setLoading(true);
    
    try {
      const supabaseCases = await casesAPI.getAll();
      
      // اگر Supabase خالی است، داده‌های LocalStorage را منتقل کن
      if (supabaseCases.length === 0) {
        await migrateLocalStorageToSupabase();
        const updatedCases = await casesAPI.getAll();
        setCases(updatedCases);
      } else {
        setCases(supabaseCases);
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری آگهی‌ها:', error);
      // در صورت خطا، از LocalStorage بارگذاری کن
      loadCasesFromLocalStorage();
    }
    
    setLoading(false);
  };

  const migrateLocalStorageToSupabase = async () => {
    const keys = [
      'GLOBAL_CASE_DATABASE',
      'MASTER_CASE_BANK',
      'adminCases',
      'globalPublicCases',
      'publicCases'
    ];
    
    let allLocalCases: any[] = [];
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsedCases = JSON.parse(data);
          if (Array.isArray(parsedCases)) {
            parsedCases.forEach(newCase => {
              if (!allLocalCases.find(existingCase => existingCase.id === newCase.id)) {
                allLocalCases.push(newCase);
              }
            });
          }
        }
      } catch (error) {
        console.log(`خطا در بارگذاری ${key}:`, error);
      }
    });

    // انتقال به Supabase
    for (const localCase of allLocalCases) {
      try {
        const caseData = {
          id: localCase.id,
          name: localCase.name,
          image: localCase.image,
          location: localCase.location,
          category: localCase.category || 'عمومی',
          price: localCase.price || 0,
          age: localCase.age || 25,
          height: localCase.height,
          skin_color: localCase.skinColor,
          body_type: localCase.bodyType,
          personality_traits: localCase.personalityTraits,
          experience_level: localCase.experienceLevel,
          description: localCase.description,
          status: localCase.status || 'active',
          verified: localCase.verified !== false,
          online: localCase.online !== false,
          is_persistent: localCase.isPersistent || false,
          details: localCase.details,
          comments: localCase.comments || []
        };

        await casesAPI.create(caseData);
        console.log(`✅ آگهی ${localCase.name} به Supabase منتقل شد`);
      } catch (error) {
        console.warn(`⚠️ خطا در انتقال آگهی ${localCase.name}:`, error);
      }
    }

    console.log(`🎉 انتقال ${allLocalCases.length} آگهی به Supabase کامل شد`);
  };

  const loadCasesFromLocalStorage = () => {
    console.log('📥 بارگذاری آگهی‌ها از LocalStorage (حالت پشتیبان)...');
    
    const keys = [
      'GLOBAL_CASE_DATABASE',
      'MASTER_CASE_BANK',
      'adminCases',
      'globalPublicCases',
      'publicCases'
    ];
    
    let allCases: CaseData[] = [];
    
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsedCases = JSON.parse(data);
          if (Array.isArray(parsedCases)) {
            parsedCases.forEach(newCase => {
              if (!allCases.find(existingCase => existingCase.id === newCase.id)) {
                allCases.push(newCase);
              }
            });
          }
        }
      } catch (error) {
        console.log(`خطا در بارگذاری ${key}:`, error);
      }
    });

    setCases(allCases);
    console.log(`✅ ${allCases.length} آگهی از LocalStorage بارگذاری شد`);
  };

  // ثبت خودکار (بدون عکس)
  const quickAddCase = async () => {
    const newCase = generateCompleteCase();
    
    try {
      const createdCase = await casesAPI.create({
        name: newCase.name,
        image: newCase.image,
        location: newCase.location,
        category: newCase.category || 'عمومی',
        price: newCase.price || 0,
        age: newCase.age || 25,
        height: newCase.height,
        skin_color: newCase.skinColor,
        body_type: newCase.bodyType,
        personality_traits: newCase.personalityTraits,
        experience_level: newCase.experienceLevel,
        description: newCase.description,
        status: 'active',
        verified: true,
        online: true,
        is_persistent: true,
        details: newCase.details,
        comments: newCase.comments || []
      });

      if (createdCase) {
        alert(`✅ آگهی "${createdCase.name}" با موفقیت ثبت شد!`);
        loadCases();
      } else {
        throw new Error('خطا در ایجاد آگهی');
      }
    } catch (error) {
      console.error('❌ خطا در ثبت آگهی:', error);
      alert('❌ خطا در ثبت آگهی');
    }
  };

  // ثبت با عکس (اول عکس، بعد خودکار مشخصات)
  const startImageUpload = () => {
    setShowImageUploadModal(true);
    setUploadForm({ images: [], uploading: false });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadForm(prev => ({ ...prev, uploading: true }));

    // پردازش همه فایل‌ها (تا 5 عکس)
    const maxImages = 5;
    const selectedFiles = Array.from(files).slice(0, maxImages);
    let processedImages: string[] = [];
    let processedCount = 0;

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processedImages.push(result);
        }
        
        processedCount++;
        
        // وقتی همه عکس‌ها پردازش شدند
        if (processedCount === selectedFiles.length) {
          setUploadForm({
            images: processedImages,
            uploading: false
          });
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImageSubmit = async () => {
    if (uploadForm.images.length === 0) {
      alert('لطفاً ابتدا حداقل یک عکس آپلود کنید');
      return;
    }
    
    try {
      // تولید آگهی کامل با عکس‌های آپلود شده
      const newCase = generateCompleteCase(uploadForm.images[0]); // عکس اصلی
      
      const createdCase = await casesAPI.create({
        name: newCase.name,
        image: uploadForm.images[0], // عکس اصلی
        location: newCase.location,
        category: newCase.category || 'عمومی',
        price: newCase.price || 0,
        age: newCase.age || 25,
        height: newCase.height,
        skin_color: newCase.skinColor,
        body_type: newCase.bodyType,
        personality_traits: newCase.personalityTraits,
        experience_level: newCase.experienceLevel,
        description: newCase.description,
        status: 'active',
        verified: true,
        online: true,
        is_persistent: true,
        details: {
          ...newCase.details,
          gallery_images: uploadForm.images // همه عکس‌ها در گالری
        },
        comments: newCase.comments || []
      });

      if (createdCase) {
        alert(`✅ آگهی "${createdCase.name}" با ${uploadForm.images.length} عکس ثبت شد!

📋 مشخصات تولید شده:
👤 نام: ${createdCase.name}
📍 استان: ${createdCase.location}
🏃‍♀️ قد: ${createdCase.height}
🎨 رنگ پوست: ${createdCase.skin_color}
💪 نوع اندام: ${createdCase.body_type}
⭐ سطح تجربه: ${createdCase.experience_level}
😊 ویژگی‌ها: ${createdCase.personality_traits?.join(', ')}
📸 تعداد عکس: ${uploadForm.images.length}
💬 ${createdCase.comments?.length} نظر تولید شد`);
        
        setShowImageUploadModal(false);
        setUploadForm({ images: [], uploading: false });
        loadCases();
      } else {
        throw new Error('خطا در ایجاد آگهی');
      }
    } catch (error) {
      console.error('❌ خطا در ثبت آگهی با عکس:', error);
      alert('❌ خطا در ثبت آگهی');
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateCaseStatus = async (caseId: number, newStatus: string) => {
    try {
      const updatedCase = await casesAPI.update(caseId, { status: newStatus });
      if (updatedCase) {
        console.log(`✅ وضعیت آگهی ${caseId} به ${newStatus} تغییر کرد`);
        loadCases();
      }
    } catch (error) {
      console.error('❌ خطا در به‌روزرسانی وضعیت آگهی:', error);
    }
  };

  const activeCases = cases.filter(c => c.status === 'active');
  const totalCases = cases.length;
  const reservedCases = cases.filter(c => c.status === 'reserved').length;
  const persistentCases = cases.filter(c => c.is_persistent).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری داده‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <NavBar 
        title="پنل مدیریت" 
        showBack={false}
        rightAction={
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <i className="ri-settings-3-line text-xl"></i>
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                navigate('/');
                alert('با موفقیت خارج شدید');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <i className="ri-logout-circle-line text-xl"></i>
            </button>
          </div>
        }
      />

      <div className="pt-20 pb-20 px-4">
        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={quickAddCase}
            className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold py-4 px-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <i className="ri-magic-line text-2xl mb-2"></i>
              <p className="text-xs font-bold">ثبت خودکار</p>
              <p className="text-xs opacity-80">Supabase</p>
            </div>
          </button>

          <button 
            onClick={startImageUpload}
            className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-semibold py-4 px-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <i className="ri-image-add-line text-2xl mb-2"></i>
              <p className="text-xs font-bold">ثبت با عکس</p>
              <p className="text-xs opacity-80">Supabase</p>
            </div>
          </button>

          <button 
            onClick={() => setShowCasesModal(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold py-4 px-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            <div className="text-center">
              <i className="ri-list-check text-2xl mb-2"></i>
              <p className="text-xs font-bold">مدیریت</p>
              <p className="text-xs opacity-80">آگهی‌ها</p>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center">
            <i className="ri-database-2-line ml-2 text-green-400"></i>
            آمار سیستم
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{activeCases.length}</div>
              <div className="text-green-300 text-sm">آگهی فعال</div>
            </div>
            <div className="bg-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{totalCases}</div>
              <div className="text-blue-300 text-sm">کل آگهی‌ها</div>
            </div>
            <div className="bg-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{persistentCases}</div>
              <div className="text-purple-300 text-sm">آگهی کامل</div>
            </div>
            <div className="bg-yellow-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{reservedCases}</div>
              <div className="text-yellow-300 text-sm">رزرو شده</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center text-white/80 text-sm">
              <i className="ri-shield-check-line text-green-400 ml-2"></i>
              دیتابیس متصل - داده‌ها امن و محفوظ
            </div>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center">
            <i className="ri-list-check ml-2"></i>
            آخرین آگهی‌ها ({totalCases})
          </h3>
          
          {totalCases === 0 ? (
            <p className="text-gray-300 text-center py-8">هنوز آگهی‌ای ثبت نشده است</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cases.slice(0, 10).map((caseItem) => (
                <div 
                  key={caseItem.id}
                  className={`p-4 rounded-xl ${
                    caseItem.status === 'deleted' ? 'bg-gray-500/20' : 
                    caseItem.status === 'reserved' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        src={caseItem.image}
                        alt={caseItem.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm flex items-center mb-1">
                          {caseItem.name}
                          {caseItem.is_persistent && <i className="ri-bookmark-fill text-purple-400 text-xs mr-2"></i>}
                        </p>
                        <div className="text-gray-300 text-xs space-y-1">
                          <div className="flex items-center">
                            <i className="ri-map-pin-line mr-1"></i>
                            <span>{caseItem.location}</span>
                            {caseItem.height && <span className="mr-2">• {caseItem.height}</span>}
                          </div>
                          {caseItem.skin_color && (
                            <div className="flex items-center">
                              <i className="ri-palette-line mr-1"></i>
                              <span>{caseItem.skin_color}</span>
                              {caseItem.body_type && <span className="mr-2">• {caseItem.body_type}</span>}
                            </div>
                          )}
                          {caseItem.experience_level && (
                            <div className="flex items-center">
                              <i className="ri-star-line mr-1"></i>
                              <span>{caseItem.experience_level}</span>
                            </div>
                          )}
                        </div>
                        {caseItem.personality_traits && caseItem.personality_traits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {caseItem.personality_traits.slice(0, 3).map((trait, index) => (
                              <span key={index} className="bg-blue-500/30 text-blue-200 text-xs px-2 py-0.5 rounded-full">
                                {trait}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        caseItem.status === 'deleted' ? 'bg-gray-600 text-white' :
                        caseItem.status === 'reserved' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                        {caseItem.status === 'deleted' ? 'حذف شده' : 
                         caseItem.status === 'reserved' ? 'رزرو' : 'فعال'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Image Upload Modal - تغییر برای چند عکس */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <i className="ri-image-add-line text-2xl ml-3"></i>
                  ثبت آگهی با عکس‌های متعدد
                </h3>
                <button
                  onClick={() => {
                    setShowImageUploadModal(false);
                    setUploadForm({ images: [], uploading: false });
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-2">
                تا 5 عکس آپلود کنید، بقیه مشخصات خودکار تولید می‌شود
              </p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {uploadForm.images.length === 0 ? (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                      disabled={uploadForm.uploading}
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer">
                      <div className="space-y-3">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                          <i className="ri-upload-cloud-2-line text-white text-3xl"></i>
                        </div>
                        <div>
                          <p className="text-gray-700 font-semibold text-lg">عکس‌های کیس را آپلود کنید</p>
                          <p className="text-gray-500 text-sm mt-1">حداکثر 5 عکس - JPG, PNG تا 5MB هر کدام</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {uploadForm.uploading && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                        <span className="text-blue-600 text-sm">در حال آپلود عکس‌ها...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h4 className="text-gray-800 font-semibold mb-3 flex items-center">
                      <i className="ri-gallery-line ml-2 text-blue-600"></i>
                      عکس‌های آپلود شده ({uploadForm.images.length}/5)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {uploadForm.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`عکس ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-lg"
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => removeUploadedImage(index)}
                              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            {index === 0 ? 'اصلی' : `عکس ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {uploadForm.images.length < 5 && (
                      <div className="mt-3">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="addMoreImages"
                        />
                        <label 
                          htmlFor="addMoreImages" 
                          className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm cursor-pointer transition-colors"
                        >
                          <i className="ri-add-line ml-1"></i>
                          افزودن عکس بیشتر
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6">
                    <div className="text-center">
                      <i className="ri-check-line text-green-600 text-2xl mb-2"></i>
                      <p className="text-green-800 font-semibold">آماده برای تولید و ذخیره!</p>
                      <p className="text-green-600 text-sm mt-1">
                        تمام مشخصات خودکار تولید می‌شود + گالری {uploadForm.images.length} عکسه
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleImageSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300"
                  >
                    <i className="ri-add-line ml-2 text-xl"></i>
                    ثبت آگهی با {uploadForm.images.length} عکس
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cases Management Modal */}
      {showCasesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <i className="ri-list-check ml-2 text-green-600"></i>
                مدیریت آگهی‌ها
              </h3>
              <button
                onClick={() => setShowCasesModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <i className="ri-close-line text-gray-600"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] space-y-3">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <img 
                      src={caseItem.image}
                      alt={caseItem.name}
                      className="w-12 h-12 rounded-lg object-cover shadow-md mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm flex items-center">
                        {caseItem.name}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {caseItem.location} • {caseItem.skin_color} • {caseItem.body_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <select
                      value={caseItem.status}
                      onChange={(e) => updateCaseStatus(caseItem.id, e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">فعال</option>
                      <option value="reserved">رزرو</option>
                      <option value="deleted">حذف شده</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
