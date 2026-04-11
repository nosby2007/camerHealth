import { createClient } from '@supabase/supabase-js'

export default ({ env }, inject) => {
  console.log('Initializing Supabase with URL:', env.SUPABASE_URL)
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  inject('supabase', supabase)
}
