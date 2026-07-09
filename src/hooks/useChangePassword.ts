import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useChangePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
    },
  })
}