import { createClient } from '@supabase/supabase-js'

const supabaseURL = process.env.SUPABASE_URL!
const supabaseKEY = process.env.SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseURL, supabaseKEY)

