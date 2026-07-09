import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

interface InviteUserParams {
  email: string
  password: string
  role: 'admin' | 'staff'
}

export function useInviteUser() {
  return useMutation({
    mutationFn: async ({ email, password, role }: InviteUserParams) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, password, role },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      return data
    },
  })
}