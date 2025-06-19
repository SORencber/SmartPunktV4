import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import CreateOrderWizard from '../pages/CreateOrderWizard';
import { FormProvider, useForm } from 'react-hook-form';

// Increase test timeout
jest.setTimeout(30000);

// Mock API responses
const server = setupServer(
  // Auth endpoint
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        token: 'mock-token'
      })
    );
  }),

  // Device endpoints
  rest.get('/api/deviceTypes', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'Smartphone' },
          { _id: '2', name: 'Tablet' }
        ]
      })
    );
  }),

  rest.get('/api/brands', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'Apple' },
          { _id: '2', name: 'Samsung' }
        ]
      })
    );
  }),

  // Customer endpoints
  rest.get('/api/customers', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'John Doe', phone: '1234567890', email: 'john@example.com' },
          { _id: '2', name: 'Jane Smith', phone: '0987654321', email: 'jane@example.com' }
        ]
      })
    );
  }),

  // Parts endpoint
  rest.get('/api/parts', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'Screen', price: { amount: 100 }, stock: 5 },
          { _id: '2', name: 'Battery', price: { amount: 50 }, stock: 10 }
        ]
      })
    );
  }),

  // Order endpoint
  rest.post('/api/orders', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        order: {
          _id: 'new-order-id',
          orderNumber: 'ORD-001',
          customerId: { name: 'John Doe', phone: '1234567890' },
          device: {
            deviceTypeName: 'Smartphone',
            brandName: 'Apple',
            modelName: 'iPhone 12'
          },
          totalAmount: 150
        }
      })
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => {
  server.close();
  jest.restoreAllMocks();
});

// Wrapper component for form context
const WizardWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('CreateOrderWizard', () => {
  test('renders all steps correctly', async () => {
    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Check if all steps are rendered
    expect(screen.getByText('Cihaz')).toBeInTheDocument();
    expect(screen.getByText('Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Servis')).toBeInTheDocument();
    expect(screen.getByText('Ödeme')).toBeInTheDocument();
  });

  test('device step form validation', async () => {
    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Try to proceed without selecting device
    const nextButton = screen.getByText('Devam');
    fireEvent.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Cihaz türü seçiniz')).toBeInTheDocument();
    });
  });

  test('customer search functionality', async () => {
    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Navigate to customer step
    const nextButton = screen.getByText('Devam');
    fireEvent.click(nextButton);

    // Search for a customer
    const searchInput = screen.getByPlaceholderText('Müşteri ara...');
    await userEvent.type(searchInput, 'John');

    // Should show search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  test('service step calculations', async () => {
    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Navigate to service step
    const nextButton = screen.getByText('Devam');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Select central service
    const centralServiceButton = screen.getByText('Merkez Servis');
    fireEvent.click(centralServiceButton);

    // Check calculations
    await waitFor(() => {
      expect(screen.getByText('150.00 €')).toBeInTheDocument();
    });
  });

  test('payment step and order completion', async () => {
    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Navigate to payment step
    const nextButton = screen.getByText('Devam');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Enter deposit amount
    const depositInput = screen.getByLabelText('Alınan Depozito (€)');
    await userEvent.type(depositInput, '50');

    // Complete order
    const submitButton = screen.getByText('Siparişi Tamamla');
    fireEvent.click(submitButton);

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Sipariş Başarıyla Oluşturuldu')).toBeInTheDocument();
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.post('/api/orders', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, message: 'Internal server error' })
        );
      })
    );

    render(
      <WizardWrapper>
        <CreateOrderWizard />
      </WizardWrapper>
    );

    // Try to submit order
    const submitButton = screen.getByText('Siparişi Tamamla');
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();
    });
  });
}); 