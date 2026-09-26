export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff' | 'demo'
  status: 'active' | 'suspended'
  location_id: string | null
  full_name?: string | null
  avatar_url?: string | null
  last_login_at?: string | null
  last_logout_at?: string | null
  created_at: string
}