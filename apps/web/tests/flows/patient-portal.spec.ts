import { test, expect } from '@playwright/test';

test.describe('Flow: Patient Portal Experience', () => {
  
  test('Access Medical Records and Billing via Patient Account', async ({ page }) => {
    // 1. Login as Patient
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email@hospital.com/i).fill('patient.arun@citygeneral.demo');
    await page.getByPlaceholder(/enter password/i).fill('Demo@1234');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Redirected to Security/Home
    await expect(page).toHaveURL(/\/account\/security/);

    // 3. Navigate to Records
    await page.goto('/account/records');
    await expect(page.getByText(/Health Summary/i)).toBeVisible();
    await expect(page.getByText(/Vitals History/i)).toBeVisible();

    // 4. Navigate to Billing
    await page.goto('/account/billing');
    await expect(page.getByText(/Invoice History/i)).toBeVisible();
    
    // 5. Verify specialized logout for patient
    await page.getByRole('button', { name: /Log Out/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

});
