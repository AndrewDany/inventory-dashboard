export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff'
  created_at: string
}