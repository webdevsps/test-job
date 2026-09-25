export type UserRole = 'owner' | 'adviser'
export type OrderStatus = 'draft' | 'confirmed' | 'cancelled'
export type DiscountStatus = 'none' | 'sand' | 'red' | 'blocked'

export interface DiscountThresholds {
  sand: number // e.g. 300 = 3.00% (percentage × 100)
  red: number  // e.g. 500 = 5.00%
}

export interface Settings {
  minimum_rate: number
  discount_threshold_sand: number
  discount_threshold_red: number
}

export interface Product {
  id: string
  name: string
  price_usd_cents: number
  active: boolean
}

export interface Customer {
  id: string
  name: string
  city: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
}

export interface Order {
  id: string
  customer_id: string
  adviser_id: string
  rate_sdg: number
  status: OrderStatus
  created_at: string
  updated_at: string
  customer?: Customer
  adviser?: Profile
  order_lines?: OrderLine[]
}

export interface OrderLine {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_usd_cents: number      // snapshot taken at order creation — never changes
  discount_usd_cents: number
  discount_status: DiscountStatus
  owner_approved: boolean
  product?: Product
}
