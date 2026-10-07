export interface ProductVariant {
  id: number
  variantType: string
  variantValue: string
  priceDelta: number
  stock: number
  sku?: string
}

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  categoryId: number
  categoryName: string
  brand: string
  description: string
  price: number
  mrp: number
  discountPercent: number
  stock: number
  ratingAverage: number
  ratingCount: number
  featured: boolean
  active: boolean
  specs: Record<string, string>
  imageUrls: string[]
  variants: ProductVariant[]
  createdAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  bannerImageUrl?: string
  displayOrder: number
  parentId?: number
  subcategories: Category[]
}

export interface Banner {
  id: number
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  displayOrder: number
  active: boolean
}

export interface CartItem {
  cartItemId: number
  productId: number
  productName: string
  imageUrl?: string
  variantId?: number
  variantLabel?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  availableStock: number
}

export interface Cart {
  cartId: number
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  appliedCouponCode?: string
}

export interface Address {
  id: number
  label: string
  recipientName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface OrderItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: number
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  items: OrderItem[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  couponCode?: string
  customerName?: string
  customerEmail?: string
  createdAt: string
}

export interface Payment {
  paymentId: number
  orderId: number
  method: string
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  amount: number
  provider: string
  providerReference: string
  failureReason?: string
  testMode: boolean
}

export interface Review {
  id: number
  productId: number
  userName: string
  rating: number
  title?: string
  body?: string
  verifiedPurchase: boolean
  photoUrls: string[]
  createdAt: string
}

export interface Coupon {
  id: number
  code: string
  discountType: 'FLAT' | 'PERCENT'
  discountValue: number
  minOrderValue: number
  expiresAt?: string
  usageLimit?: number
  usageCount: number
  active: boolean
}

export interface User {
  id: number
  fullName: string
  email?: string
  phone?: string
  role: 'ROLE_CUSTOMER' | 'ROLE_ADMIN'
  blocked: boolean
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  lowStockCount: number
  lowStockItems: { productId: number; name: string; stock: number }[]
}
