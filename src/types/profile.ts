export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff'
  status: 'active' | 'suspended'
  created_at: string
}