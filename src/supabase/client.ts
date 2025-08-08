import { fetchWithRevalidateBuilder } from '@/nextjs/utils'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../database.types'

let supabase: SupabaseClient | undefined
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID
const API_KEY = process.env.SUPABASE_API_KEY

if (PROJECT_ID && API_KEY) {
    supabase = createClient<Database>(`https://${PROJECT_ID}.supabase.co`, API_KEY, {
        global: {
            fetch: fetchWithRevalidateBuilder(60 * 60)
        }
    })
}

export function getClient (): SupabaseClient<Database> | undefined {
    return supabase
}