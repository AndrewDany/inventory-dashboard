import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

interface InviteUserParams {
  email: string
  password: string
  role: 'admin' | 'staff' | 'demo'
}

export function useInviteUser() {
  return useMutation({
    mutationFn: async ({ email, password, role }: InviteUserParams) => {
      const { data, error } = await supabase.functions.invoke('invite-user-v2', {
        body: { email, password, role },
      })

      if (error) {
        if ('context' in error && error.context instanceof Response) {
          const errorBody = await error.context.text()
          console.error('Edge Function error body:', errorBody)
          throw new Error(errorBody || error.message)
        }
        throw new Error(error.message)
      }

      if (data?.error) throw new Error(data.error)

      return data
    },
  })
}