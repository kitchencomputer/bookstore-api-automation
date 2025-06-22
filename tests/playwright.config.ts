import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './',
    timeout: 30000,
    retries: 0,
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:8000',
    },
});