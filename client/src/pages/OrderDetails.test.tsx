import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OrderDetails } from './OrderDetails'
import { getOrderById, updateOrderStatus } from '@/api/orders'

// Mock the API calls
vi.mock('@/api/orders', () => ({
  getOrderById: vi.fn(),
  updateOrderStatus: vi.fn()
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn()
}))

describe('OrderDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<OrderDetails />)
    expect(screen.getByTestId('order-details-loading')).toBeInTheDocument()
  })

  it('displays order details after loading', async () => {
    const mockOrder = {
      order: {
        _id: '1',
        orderNumber: 'ORD-2024-001',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        deviceType: 'Phone',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 14 Pro',
        serialNumber: 'ABC123456789',
        status: 'In Progress',
        total: 299.99,
        createdAt: '2024-01-15T10:30:00Z',
        products: [
          {
            name: 'Screen Replacement',
            quantity: 1,
            price: 199.99
          }
        ],
        statusHistory: [
          {
            status: 'Pending',
            date: '2024-01-15T10:30:00Z',
            user: 'Admin'
          }
        ]
      }
    }

    ;(getOrderById as jest.Mock).mockResolvedValueOnce(mockOrder)

    render(<OrderDetails />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
      expect(screen.getByText('Screen Replacement')).toBeInTheDocument()
    })
  })

  it('allows status updates', async () => {
    const mockOrder = {
      order: {
        _id: '1',
        status: 'In Progress',
        // ... other order details
      }
    }

    const mockUpdateResponse = {
      message: 'Order status updated successfully',
      order: {
        _id: '1',
        status: 'Completed',
        updatedAt: '2024-01-15T11:00:00Z'
      }
    }

    ;(getOrderById as jest.Mock).mockResolvedValueOnce(mockOrder)
    ;(updateOrderStatus as jest.Mock).mockResolvedValueOnce(mockUpdateResponse)

    render(<OrderDetails />)

    await waitFor(() => {
      const statusSelect = screen.getByRole('combobox')
      fireEvent.change(statusSelect, { target: { value: 'completed' } })
    })

    expect(updateOrderStatus).toHaveBeenCalledWith('1', { status: 'completed' })
    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  it('shows error message when order not found', async () => {
    ;(getOrderById as jest.Mock).mockRejectedValueOnce(new Error('Order not found'))

    render(<OrderDetails />)

    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument()
    })
  })

  it('displays status history', async () => {
    const mockOrder = {
      order: {
        _id: '1',
        status: 'In Progress',
        statusHistory: [
          {
            status: 'Pending',
            date: '2024-01-15T10:30:00Z',
            user: 'Admin'
          },
          {
            status: 'In Progress',
            date: '2024-01-15T11:00:00Z',
            user: 'Tech Mike'
          }
        ]
      }
    }

    ;(getOrderById as jest.Mock).mockResolvedValueOnce(mockOrder)

    render(<OrderDetails />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Tech Mike')).toBeInTheDocument()
    })
  })
})
