import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateOrder } from './CreateOrder'
import { createOrder } from '@/api/orders'
import { getCustomers } from '@/api/customers'
import { getInventory } from '@/api/inventory'

// Mock the API calls
vi.mock('@/api/orders', () => ({
  createOrder: vi.fn()
}))

vi.mock('@/api/customers', () => ({
  getCustomers: vi.fn()
}))

vi.mock('@/api/inventory', () => ({
  getInventory: vi.fn()
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

describe('CreateOrder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form steps', () => {
    render(<CreateOrder />)
    expect(screen.getByText(/step 1: customer selection/i)).toBeInTheDocument()
    expect(screen.getByText(/step 2: device information/i)).toBeInTheDocument()
    expect(screen.getByText(/step 3: service options/i)).toBeInTheDocument()
    expect(screen.getByText(/step 4: products/i)).toBeInTheDocument()
    expect(screen.getByText(/step 5: payment/i)).toBeInTheDocument()
  })

  it('allows customer search and selection', async () => {
    const mockCustomers = {
      customers: [
        {
          _id: '1',
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          preferredLanguage: 'EN',
          totalOrders: 5
        }
      ]
    }

    ;(getCustomers as jest.Mock).mockResolvedValueOnce(mockCustomers)

    render(<CreateOrder />)

    const searchInput = screen.getByPlaceholderText(/search by phone number/i)
    fireEvent.change(searchInput, { target: { value: 'john' } })

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('John Doe'))
    expect(screen.getByText('+1234567890')).toBeInTheDocument()
  })

  it('validates required fields before proceeding to next step', async () => {
    render(<CreateOrder />)

    // Try to proceed without selecting a customer
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/please select a customer/i)).toBeInTheDocument()
    })
  })

  it('allows device information input', async () => {
    const mockCustomers = {
      customers: [
        {
          _id: '1',
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          preferredLanguage: 'EN',
          totalOrders: 5
        }
      ]
    }

    ;(getCustomers as jest.Mock).mockResolvedValueOnce(mockCustomers)

    render(<CreateOrder />)

    // Select customer first
    const searchInput = screen.getByPlaceholderText(/search by phone number/i)
    fireEvent.change(searchInput, { target: { value: 'john' } })
    await waitFor(() => {
      fireEvent.click(screen.getByText('John Doe'))
    })

    // Proceed to device information
    fireEvent.click(screen.getByText('Next'))

    // Fill device information
    fireEvent.change(screen.getByLabelText(/device type/i), { target: { value: 'phone' } })
    fireEvent.change(screen.getByLabelText(/brand/i), { target: { value: 'apple' } })
    fireEvent.change(screen.getByLabelText(/model/i), { target: { value: 'iPhone 14 Pro' } })
    
    expect(screen.getByDisplayValue('iPhone 14 Pro')).toBeInTheDocument()
  })

  it('submits the form successfully', async () => {
    const mockOrderResponse = {
      order: {
        _id: '1',
        orderNumber: 'ORD-2024-001',
        barcode: 'RF00001234'
      },
      message: 'Order created successfully'
    }

    ;(createOrder as jest.Mock).mockResolvedValueOnce(mockOrderResponse)

    render(<CreateOrder />)

    // Fill all required fields and submit
    // ... (implement the full form submission test)

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalled()
    })
  })
})
