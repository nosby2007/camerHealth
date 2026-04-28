import { createSupabaseAuthCompat } from '~/services/supabase-auth-compat'

export default ({ $config, env }, inject) => {
  const supabaseUrl = $config.SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey = $config.SUPABASE_KEY || env.SUPABASE_KEY
  const enableSupabaseAuth = $config.ENABLE_SUPABASE_AUTH

  // Transitional compatibility scaffold:
  // This injects an optional Supabase Auth facade without replacing
  // the current prototype login flow unless explicitly enabled.
  const compat = createSupabaseAuthCompat({
    supabaseUrl,
    supabaseKey,
    enableSupabaseAuth
  })

  inject('supabaseAuthCompat', compat)
}
