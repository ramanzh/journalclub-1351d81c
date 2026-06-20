import { createClient } from '@supabase/supabase-js';

// مشخصات مستقیم سوپابیس شما بدون نیاز به فایل .env
const SUPABASE_URL = "https://ktvcpwzcdapoazlglajp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0fTBaCTZRAhW4tXpGcQgoQ_zpHRnAb7";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
