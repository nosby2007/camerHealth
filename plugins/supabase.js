import { createClient } from '@supabase/supabase-js'

export default ({ env }, inject) => {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  inject('supabase', supabase)
}
