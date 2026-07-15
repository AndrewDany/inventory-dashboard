import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

interface InviteUserParams {
  email: string
  password: string
  role: 'admin' | 'staff' | 'demo'
  locationId?: string
}

export function useInviteUser() {
  return useMutation({
    mutationFn: async ({ email, password, role, locationId }: InviteUserParams) => {
      const { data, error } = await supabase.functions.invoke('invite-user-v2', {
        body: { email, password, role, locationId },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      return data
    },
  })
}