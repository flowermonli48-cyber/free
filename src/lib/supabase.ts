
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface CaseData {
  id: number;
  name: string;
  image: string;
  location: string;
  category: string;
  price: number;
  age: number;
  height?: string;
  skin_color?: string;
  body_type?: string;
  personality_traits?: string[];
  experience_level?: string;
  description: string;
  status: string;
  verified: boolean;
  online: boolean;
  is_persistent?: boolean;
  details?: any;
  comments?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface VerificationRequest {
  id?: number;
  case_id: number;
  full_name: string;
  national_id: string;
  phone_number: string;
  status?: string;
  created_at?: string;
}

export interface ChatMessage {
  id?: number;
  case_id: number;
  user_id?: string;
  message_text: string;
  is_user: boolean;
  message_type?: string;
  created_at?: string;
}

export interface SystemConfig {
  id?: number;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  payment_gateway_url?: string;
  default_fee_amount?: number;
  created_at?: string;
  updated_at?: string;
}

// API Functions
export const casesAPI = {
  // دریافت همه آگهی‌ها
  getAll: async (): Promise<CaseData[]> => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('خطا در بارگذاری آگهی‌ها:', error);
      return [];
    }
    
    return data || [];
  },

  // دریافت آگهی با ID
  getById: async (id: number): Promise<CaseData | null> => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`خطا در بارگذاری آگهی ${id}:`, error);
      return null;
    }
    
    return data;
  },

  // اضافه کردن آگهی جدید
  create: async (caseData: Omit<CaseData, 'id' | 'created_at' | 'updated_at'>): Promise<CaseData | null> => {
    const { data, error } = await supabase
      .from('cases')
      .insert([caseData])
      .select()
      .single();
    
    if (error) {
      console.error('خطا در ایجاد آگهی:', error);
      return null;
    }
    
    return data;
  },

  // به‌روزرسانی آگهی
  update: async (id: number, updates: Partial<CaseData>): Promise<CaseData | null> => {
    const { data, error } = await supabase
      .from('cases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('خطا در به‌روزرسانی آگهی:', error);
      return null;
    }
    
    return data;
  },

  // دریافت آگهی‌های فعال
  getActive: async (): Promise<CaseData[]> => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('خطا در بارگذاری آگهی‌های فعال:', error);
      return [];
    }
    
    return data || [];
  }
};

export const verificationAPI = {
  // ایجاد درخواست تایید
  create: async (request: Omit<VerificationRequest, 'id' | 'created_at'>): Promise<VerificationRequest | null> => {
    const { data, error } = await supabase
      .from('verification_requests')
      .insert([request])
      .select()
      .single();
    
    if (error) {
      console.error('خطا در ایجاد درخواست تایید:', error);
      return null;
    }
    
    return data;
  },

  // دریافت درخواست‌های تایید
  getAll: async (): Promise<VerificationRequest[]> => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('خطا در بارگذاری درخواست‌های تایید:', error);
      return [];
    }
    
    return data || [];
  }
};

export const chatAPI = {
  // ذخیره پیام چت
  saveMessage: async (message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage | null> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) {
      console.error('خطا در ذخیره پیام چت:', error);
      return null;
    }
    
    return data;
  },

  // دریافت پیام‌های چت برای کیس
  getMessages: async (caseId: number): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('خطا در بارگذاری پیام‌های چت:', error);
      return [];
    }
    
    return data || [];
  }
};

export const systemAPI = {
  // دریافت تنظیمات سیستم
  getConfig: async (): Promise<SystemConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('خطا در بارگذاری تنظیمات سیستم:', error);
        return null;
      }
      
      // اگر هیچ رکوردی وجود ندارد، یک رکورد اولیه ایجاد کن
      if (!data || data.length === 0) {
        console.log('📝 ایجاد رکورد اولیه تنظیمات سیستم...');
        const initialConfig = {
          telegram_bot_token: '',
          telegram_chat_id: '',
          payment_gateway_url: 'https://payment.example.com',
          default_fee_amount: 250000
        };
        
        const { data: newConfig, error: insertError } = await supabase
          .from('system_config')
          .insert([initialConfig])
          .select()
          .single();
        
        if (insertError) {
          console.error('خطا در ایجاد تنظیمات اولیه:', insertError);
          return null;
        }
        
        console.log('✅ رکورد اولیه تنظیمات ایجاد شد');
        return newConfig;
      }
      
      return data[0];
    } catch (error) {
      console.error('خطای غیرمنتظره در getConfig:', error);
      return null;
    }
  },

  // به‌روزرسانی تنظیمات سیستم
  updateConfig: async (config: Omit<SystemConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SystemConfig | null> => {
    try {
      // ابتدا بررسی کنیم که آیا تنظیماتی وجود دارد یا نه
      const { data: existing, error: selectError } = await supabase
        .from('system_config')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (selectError) {
        console.error('خطا در بررسی تنظیمات موجود:', selectError);
        return null;
      }

      if (existing && existing.length > 0) {
        // به‌روزرسانی تنظیمات موجود
        const { data, error } = await supabase
          .from('system_config')
          .update({ 
            ...config, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing[0].id)
          .select()
          .single();
        
        if (error) {
          console.error('خطا در به‌روزرسانی تنظیمات:', error);
          return null;
        }
        
        console.log('✅ تنظیمات با موفقیت به‌روزرسانی شد');
        return data;
      } else {
        // ایجاد تنظیمات جدید
        const { data, error } = await supabase
          .from('system_config')
          .insert([{
            ...config,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) {
          console.error('خطا در ایجاد تنظیمات:', error);
          return null;
        }
        
        console.log('✅ تنظیمات جدید با موفقیت ایجاد شد');
        return data;
      }
    } catch (error) {
      console.error('خطای غیرمنتظره در updateConfig:', error);
      return null;
    }
  },

  // تست اتصال به دیتابیس
  testConnection: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('خطا در تست اتصال:', error);
        return false;
      }
      
      console.log('✅ اتصال به دیتابیس موفق');
      return true;
    } catch (error) {
      console.error('خطای غیرمنتظره در تست اتصال:', error);
      return false;
    }
  }
};
