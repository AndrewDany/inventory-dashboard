import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
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
    onSuccess: () => {
      toast.success('Password reset successfully')
    },
    onError: (error) => {
      toast.error(`Failed to reset password: ${error.message}`)
    },
  })
}