import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/utils/logger';

interface TestResult {
  page: string;
  action: string;
  status: 'success' | 'failure';
  error?: string;
  timestamp: string;
  details?: any;
}

class TestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
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
  }

  private recordResult(page: string, action: string, status: 'success' | 'failure', error?: string, details?: any) {
    const result: TestResult = {
      page,
      action,
      status,
      error,
      timestamp: new Date().toISOString(),
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
        this.recordResult('login', 'login_attempt', 'failure', errorText || 'Login failed');
        return false;
      }

      this.recordResult('login', 'login_attempt', 'success');
      return true;
    } catch (error) {
      this.recordResult('login', 'login_attempt', 'failure', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async testPage(pageUrl: string, actions: (page: Page) => Promise<void>) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(`${this.baseUrl}${pageUrl}`);
      await this.page.waitForLoadState('networkidle');
      
      // Test all buttons
      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        try {
          const isVisible = await button.isVisible();
          if (isVisible) {
            const buttonText = await button.textContent();
            await button.click();
            this.recordResult(pageUrl, `button_click_${buttonText}`, 'success');
          }
        } catch (error) {
          this.recordResult(pageUrl, 'button_click', 'failure', error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Test all links
      const links = await this.page.$$('a');
      for (const link of links) {
        try {
          const isVisible = await link.isVisible();
          if (isVisible) {
            const href = await link.getAttribute('href');
            if (href && !href.startsWith('http')) {
              await link.click();
              await this.page.waitForLoadState('networkidle');
              this.recordResult(pageUrl, `link_click_${href}`, 'success');
              await this.page.goBack();
            }
          }
        } catch (error) {
          this.recordResult(pageUrl, 'link_click', 'failure', error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Run custom actions
      await actions(this.page);
      
      this.recordResult(pageUrl, 'page_test', 'success');
    } catch (error) {
      this.recordResult(pageUrl, 'page_test', 'failure', error instanceof Error ? error.message : 'Unknown error');
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
        this.recordResult('api', endpoint, 'failure', `Status: ${response.status}`, response.data);
      } else {
        this.recordResult('api', endpoint, 'success', undefined, response.data);
      }
    } catch (error) {
      this.recordResult('api', endpoint, 'failure', error instanceof Error ? error.message : 'Unknown error');
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
      await this.testPage(page.url, async (page) => {
        // Add page-specific tests here
        if (page.url === '/orders') {
          // Test order filters
          await page.click('button[aria-label="Filter orders"]');
          await page.click('button[aria-label="Apply filters"]');
        }
        
        if (page.url === '/customers') {
          // Test customer search
          await page.fill('input[placeholder="Search customers..."]', 'test');
          await page.keyboard.press('Enter');
        }
      });
    }

    // Test all API endpoints
    for (const endpoint of apiEndpoints) {
      await this.testApiEndpoint(endpoint.url, endpoint.method);
    }

    // Generate test report
    this.generateReport();
  }

  private generateReport() {
    const report = {
      summary: {
        total: this.results.length,
        success: this.results.filter(r => r.status === 'success').length,
        failure: this.results.filter(r => r.status === 'failure').length,
      },
      results: this.results,
    };

    logger.info('Test Report:', JSON.stringify(report, null, 2));
    
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