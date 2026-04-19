import { test, expect } from '@playwright/test';

test.describe('Flow: Clinical Operations (Nurse Station)', () => {
  
  test('Monitor and Update Patient Vitals', async ({ page }) => {
    // 1. Login as Nurse
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email@hospital.com/i).fill('nurse.priya@citygeneral.demo');
    await page.getByPlaceholder(/enter password/i).fill('Demo@1234');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 2. Dashboard should redirect to Nurse Station
    await expect(page).toHaveURL(/\/ipd\/nurse-station/);

    // 3. Find a High Risk patient (e.g. Meena Sharma from mock data)
    const patientCard = page.getByText('Meena Sharma').locator('xpath=./ancestor::div[contains(@class, "Card")]');
    await expect(patientCard).toBeVisible();

    // 4. Expand Card
    await patientCard.click();
    
    // 5. Enter New Vitals (Update)
    await page.getByRole('button', { name: /\+ Enter New Vitals/i }).click();
    // Systolic BP (sbp)
    await page.locator('input[type="number"]').nth(2).fill('120'); // Stabilizing her BP
    await page.getByRole('button', { name: /Save Vitals/i }).click();

    // 6. Acknowledge the alert if still visible or verify stabilization
    await expect(page.getByText(/Vitals saved/i)).toBeHidden(); // It updates in-place
    
    // 7. Verify NEWS2 score change (should be lower now)
    const newsScore = await patientCard.locator('.text-xl').textContent();
    expect(Number(newsScore)).toBeLessThan(10); // Meena was 10 initially
  });

});
