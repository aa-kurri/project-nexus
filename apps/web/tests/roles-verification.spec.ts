import { test, expect } from '@playwright/test';

const DEMO_PASSWORD = 'Demo@1234';
const ROLES = [
  { role: 'Admin',      email: 'admin@citygeneral.demo',          expectedPath: '/dashboard' },
  { role: 'Doctor',     email: 'dr.sharma@citygeneral.demo',       expectedPath: '/opd/queue' },
  { role: 'Nurse',      email: 'nurse.priya@citygeneral.demo',     expectedPath: '/ipd/nurse-station' },
  { role: 'Pharmacist', email: 'pharma.raj@citygeneral.demo',      expectedPath: '/pharmacy/stock' },
  { role: 'Lab Tech',   email: 'lab.kumar@citygeneral.demo',       expectedPath: '/lims/worklist' },
  { role: 'Patient',    email: 'patient.arun@citygeneral.demo',    expectedPath: '/account/security' },
];

test.describe('Ayura OS Role-Based Access Verification', () => {

  test('Landing Page should be clean of legacy social proof', async ({ page }) => {
    await page.goto('/');
    
    // Ensure no legacy logos are visible in hero
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('apollo');
    expect(content.toLowerCase()).not.toContain('manipal');
    
    // Check main call to action
    await expect(page.getByText(/The Operating System/i)).toBeVisible();
  });

  for (const { role, email, expectedPath } of ROLES) {
    test(`Login and Navigate: ${role}`, async ({ page }) => {
      // 1. Visit login
      await page.goto('/auth/login');
      
      // 2. Clear and fill credentials
      await page.getByPlaceholder(/email@hospital.com/i).fill(email);
      await page.getByPlaceholder(/enter password/i).fill(DEMO_PASSWORD);
      
      // 3. Click Sign In
      await page.getByRole('button', { name: /Sign In/i }).click();
      
      // 4. Verification: Should land on role-specific page
      await expect(page).toHaveURL(new RegExp(expectedPath));
      
      // 5. Sanity Check: No 404 or Critical Crash
      const title = await page.title();
      expect(title.toLowerCase()).not.toContain('404');
      expect(title.toLowerCase()).not.toContain('error');

      // 6. Logout cleanup
      // Most roles have a TopBar with a logout button
      if (role !== 'Patient') {
        await page.getByRole('button', { name: /Log Out/i }).first().click();
        await expect(page).toHaveURL(/\/auth\/login/);
      } else {
        // Patient portal specialized logout
        const logoutBtn = page.getByRole('button', { name: /Log Out/i });
        if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
          await expect(page).toHaveURL(/\/auth\/login/);
        }
      }
    });
  }

});
