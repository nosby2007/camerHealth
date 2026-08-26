import { createClient } from '@supabase/supabase-js'

export default ({ env }, inject) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    inject('supabase', null)
    return
  }
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  inject('supabase', supabase)
}
