import { expect, test } from '@playwright/test'

test('first run onboarding works from a clean browser context', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welkom' })).toBeVisible()
  await expect(page.getByText('Maak een eerste profiel aan om de app te starten.')).toBeVisible()

  await page.getByLabel('Naam').fill('Milan')
  await page.getByLabel('Export naar').selectOption('CH Construct')
  await page.getByRole('button', { name: 'Start' }).click()

  await expect(page.getByRole('heading', { name: 'Profiel herstellen' })).toBeVisible()
  await page.getByRole('button', { name: 'Milan · CH Construct' }).click()

  await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vandaag' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Registraties/i })).toBeVisible()
  await expect(page.getByText('Dagtotaal')).toBeVisible()
})
