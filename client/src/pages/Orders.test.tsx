import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Orders } from './Orders'
import { getOrders } from '@/api/orders'

// Mock the API calls
vi.mock('@/api/orders', () => ({
  getOrders: vi.fn()
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

describe('Orders Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<Orders />)
    expect(screen.getByTestId('orders-loading')).toBeInTheDocument()
  })

  it('displays orders after loading', async () => {
    const mockOrders = {
      orders: [
        {
          _id: '1',
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          deviceType: 'Phone',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 14 Pro',
          status: 'In Progress',
          total: 299.99,
          createdAt: '2024-01-15T10:30:00Z'
        }
      ]
    }

    ;(getOrders as jest.Mock).mockResolvedValueOnce(mockOrders)

    render(<Orders />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
    })
  })

  it('filters orders by search term', async () => {
    const mockOrders = {
      orders: [
        {
          _id: '1',
          customerName: 'John Doe',
          customerPhone: '+1234567890',
          deviceType: 'Phone',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 14 Pro',
          status: 'In Progress',
          total: 299.99,
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          customerName: 'Jane Smith',
          customerPhone: '+1234567891',
          deviceType: 'Tablet',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy Tab S9',
          status: 'Pending',
          total: 199.99,
          createdAt: '2024-01-15T11:30:00Z'
        }
      ]
    }

    ;(getOrders as jest.Mock).mockResolvedValueOnce(mockOrders)

    render(<Orders />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search orders/i)
      fireEvent.change(searchInput, { target: { value: 'john' } })
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('filters orders by status', async () => {
    const mockOrders = {
      orders: [
        {
          _id: '1',
          customerName: 'John Doe',
          deviceType: 'Phone',
          status: 'In Progress',
          total: 299.99,
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          customerName: 'Jane Smith',
          deviceType: 'Tablet',
          status: 'Pending',
          total: 199.99,
          createdAt: '2024-01-15T11:30:00Z'
        }
      ]
    }

    ;(getOrders as jest.Mock).mockResolvedValueOnce(mockOrders)

    render(<Orders />)

    await waitFor(() => {
      const statusFilter = screen.getByRole('combobox')
      fireEvent.change(statusFilter, { target: { value: 'pending' } })
    })

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows empty state when no orders match filters', async () => {
    const mockOrders = {
      orders: [
        {
          _id: '1',
          customerName: 'John Doe',
          deviceType: 'Phone',
          status: 'In Progress',
          total: 299.99,
          createdAt: '2024-01-15T10:30:00Z'
        }
      ]
    }

    ;(getOrders as jest.Mock).mockResolvedValueOnce(mockOrders)

    render(<Orders />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search orders/i)
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    })

    expect(screen.getByText(/no orders found/i)).toBeInTheDocument()
  })
})
