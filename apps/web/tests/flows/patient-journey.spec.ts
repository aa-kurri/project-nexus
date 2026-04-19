import { test, expect } from '@playwright/test';

test.describe('Flow: Patient Registration & Queue', () => {
  
  test('New Patient Onboarding Flow', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email@hospital.com/i).fill('admin@citygeneral.demo');
    await page.getByPlaceholder(/enter password/i).fill('Demo@1234');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Navigate to New Patient
    await page.goto('/opd/new-patient');
    
    // 3. Fill basic fields
    await page.getByPlaceholder(/First name/i).fill('Automated');
    await page.getByPlaceholder(/Last name/i).fill('Test-User');
    await page.getByPlaceholder(/Mobile number/i).first().fill('9101112223');
    await page.getByRole('button', { name: 'Male', exact: true }).click();
    
    // 4. Select Consultant
    // Since Select is a custom component, we find the select element or click the text
    await page.locator('select').filter({ hasText: /Consultant/i }).selectOption({ label: 'Dr. Chenna Reddy (Orthopaedic)' });
    
    // 5. Submit
    await page.getByRole('button', { name: /REGISTER/i }).click();

    // 6. Verify success page
    await expect(page.getByText(/Patient Registered Successfully/i)).toBeVisible();
    const uhid = await page.locator('p.text-3xl').textContent();
    expect(uhid).toContain('AY-');

    // 7. Check OPD Queue
    await page.getByRole('link', { name: /Go to Queue/i }).click();
    await expect(page).toHaveURL(/\/opd\/queue/);
    await expect(page.getByText('Automated Test-User')).toBeVisible();
  });

});
