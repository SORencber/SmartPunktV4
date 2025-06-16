import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/utils/logger';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  error?: string;
  details?: any;
}

interface ReactErrorEvent {
  detail: string;
}

class TestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private consoleErrors: string[] = [];
  private reactErrors: string[] = [];
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async initialize() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Setup logging
    this.page.on('console', msg => {
      logger.info(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });

    this.page.on('pageerror', error => {
      logger.error(`Browser Page Error: ${error.message}`);
      this.recordResult('browser', 'page_error', 'failure', error.message);
    });

    this.page.on('request', request => {
      logger.info(`API Request: ${request.method()} ${request.url()}`);
    });

    this.page.on('response', response => {
      logger.info(`API Response: ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        this.recordResult('api', response.url(), 'failure', `Status: ${response.status()}`);
      }
    });

    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
        logger.error('Console Error:', msg.text());
        this.recordResult('console', 'failed', msg.text());
      }
    });

    // Monitor page errors
    this.page.on('pageerror', error => {
      this.consoleErrors.push(error.message);
      logger.error('Page Error:', error.message);
      this.recordResult('page', 'failed', error.message);
    });

    // Monitor React error boundaries
    await this.page.addInitScript(() => {
      window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('ErrorBoundary')) {
          const customEvent = new CustomEvent('react-error-boundary', {
            detail: event.error.message
          });
          window.dispatchEvent(customEvent);
        }
      });
    });

    // Listen for custom react-error-boundary events
    await this.page.exposeFunction('onReactError', (error: string) => {
      this.reactErrors.push(error);
      logger.error('React Error:', error);
    });

    await this.page.addInitScript(() => {
      window.addEventListener('react-error-boundary', ((event: CustomEvent<ReactErrorEvent>) => {
        (window as any).onReactError(event.detail);
      }) as EventListener);
    });

    // Monitor network errors
    this.page.on('response', response => {
      if (!response.ok()) {
        logger.error('Network Error:', `${response.url()} - ${response.status()} ${response.statusText()}`);
      }
    });
  }

  private recordResult(name: string, status: 'passed' | 'failed', error?: string, details?: any) {
    const result: TestResult = {
      name,
      status,
      error,
      details
    };
    this.results.push(result);
    logger.info(`Test Result: ${JSON.stringify(result)}`);
  }

  async login(username: string, password: string) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.fill('input[name="username"]', username);
      await this.page.fill('input[name="password"]', password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation();
      
      const errorMessage = await this.page.$('.error-message');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        this.recordResult('login', 'failed', errorText || 'Login failed');
        return false;
      }

      this.recordResult('login', 'passed', undefined);
      return true;
    } catch (error) {
      this.recordResult('login', 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async testPage(url: string, name: string) {
    if (!this.page) throw new Error('Test runner not initialized');

    try {
      // Clear previous errors
      this.consoleErrors = [];
      this.reactErrors = [];

      // Navigate to page
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');

      // Check for console errors
      if (this.consoleErrors.length > 0) {
        throw new Error(`Console errors found: ${this.consoleErrors.join(', ')}`);
      }

      // Check for React errors
      if (this.reactErrors.length > 0) {
        throw new Error(`React errors found: ${this.reactErrors.join(', ')}`);
      }

      // Test all buttons and links
      const buttons = await this.page.$$('button, [role="button"], a');
      for (const button of buttons) {
        const isVisible = await button.isVisible();
        if (isVisible) {
          try {
            await button.click();
            await this.page.waitForTimeout(100); // Wait for any state updates
          } catch (err) {
            const error = err as Error;
            logger.warn(`Button click failed: ${error.message}`);
          }
        }
      }

      // Test form inputs
      const inputs = await this.page.$$('input, select, textarea');
      for (const input of inputs) {
        const isVisible = await input.isVisible();
        if (isVisible) {
          try {
            await input.click();
            await this.page.waitForTimeout(100);
          } catch (err) {
            const error = err as Error;
            logger.warn(`Input interaction failed: ${error.message}`);
          }
        }
      }

      // Check component rendering
      const errorBoundary = await this.page.$('[data-testid="error-boundary"]');
      if (errorBoundary) {
        const errorText = await errorBoundary.textContent();
        if (errorText?.includes('Error')) {
          throw new Error(`Error boundary caught error: ${errorText}`);
        }
      }

      this.results.push({ name, status: 'passed' });
    } catch (err) {
      const error = err as Error;
      this.results.push({
        name,
        status: 'failed',
        error: error.message,
        details: {
          consoleErrors: this.consoleErrors,
          reactErrors: this.reactErrors
        }
      });
      logger.error(`Test failed for ${name}:`, error);
    }
  }

  async testApiEndpoint(endpoint: string, method: string = 'GET', body?: any) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      const response = await this.page.evaluate(async ({ endpoint, method, body }) => {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        return {
          status: response.status,
          data: await response.json(),
        };
      }, { endpoint: `${this.baseUrl}${endpoint}`, method, body });

      if (response.status >= 400) {
        this.recordResult('api', 'failed', `Status: ${response.status}`, response.data);
      } else {
        this.recordResult('api', 'passed', undefined, response.data);
      }
    } catch (error) {
      this.recordResult('api', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async runAllTests() {
    const pages = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/orders', name: 'Orders' },
      { url: '/customers', name: 'Customers' },
      { url: '/create-order', name: 'Create Order' },
      { url: '/logs', name: 'Logs' },
    ];

    const apiEndpoints = [
      { url: '/api/orders', method: 'GET' },
      { url: '/api/customers', method: 'GET' },
      { url: '/api/logs', method: 'GET' },
    ];

    // Test login
    await this.login('demo-admin', 'demo-password');

    // Test all pages
    for (const page of pages) {
      await this.testPage(page.url, page.name);
    }

    // Test all API endpoints
    for (const endpoint of apiEndpoints) {
      await this.testApiEndpoint(endpoint.url, endpoint.method);
    }

    // Generate test report
    await this.generateReport();
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.status === 'passed').length,
      failedTests: this.results.filter(r => r.status === 'failed').length,
      results: this.results,
      consoleErrors: this.consoleErrors,
      reactErrors: this.reactErrors
    };

    logger.info('Test Report:', report);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export const runTests = async () => {
  const runner = new TestRunner('http://localhost:5173');
  try {
    await runner.initialize();
    await runner.runAllTests();
  } catch (error) {
    logger.error('Test runner error:', error);
  } finally {
    await runner.cleanup();
  }
}; 