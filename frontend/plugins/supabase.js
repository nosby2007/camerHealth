import { createClient } from '@supabase/supabase-js'

export default ({ env }, inject) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('[CameroHealth] SUPABASE_URL et SUPABASE_KEY sont requis. Vérifiez votre fichier .env')
  }
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  inject('supabase', supabase)
}
