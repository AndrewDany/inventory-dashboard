export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff' | 'demo'
  status: 'active' | 'suspended'
  created_at: string
}