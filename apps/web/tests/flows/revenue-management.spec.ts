import { test, expect } from '@playwright/test';

test.describe('Flow: Revenue & Records Management', () => {
  
  test('Payment Collection & Bill Reprinting', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email@hospital.com/i).fill('admin@citygeneral.demo');
    await page.getByPlaceholder(/enter password/i).fill('Demo@1234');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Navigate to Billing
    await page.goto('/billing/payments');

    // 3. Search and Select Patient
    await page.getByPlaceholder(/Search by Name or MR No/i).fill('Rajesh Kumar');
    await page.getByText(/Rajesh Kumar/i).first().click();

    // 4. Verify outstanding balance
    await expect(page.getByText(/Outstanding Balance/i)).toBeVisible();
    
    // 5. Simulate Payment
    await page.getByRole('button', { name: /COLLECT PAYMENT/i }).click();
    await page.getByRole('button', { name: /Print Receipt/i }).click();

    // 6. Go to Records Hub for Reprint
    await page.goto('/opd/records');
    await page.getByRole('button', { name: /Reprint Bill/i }).click();
    await page.getByPlaceholder(/Patient Name or MR No/i).fill('Rajesh Kumar');
    await expect(page.getByText(/Bill # /i)).toBeVisible();

    // 7. Test Thermal Reprint
    await page.getByRole('button', { name: /Thermal/i }).first().click();
    await expect(page.getByText(/Receipt Generated/i)).toBeVisible();
  });

});
