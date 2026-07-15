export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff' | 'demo'
  status: 'active' | 'suspended'
  location_id: string | null
  created_at: string
}