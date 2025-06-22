import { test, expect } from '@playwright/test';

const testUser = {
    email: `user${Date.now()}@test.com`,
    password: 'TestPass123!'
};

const invalidUser = {
    email: `invalid${Date.now()}@test.com`,
    password: 'WrongPass!'
};

let token: string;
let bookId: number;

test.describe('Bookstore API', () => {
    test('Health check', async ({ request }) => {
        const res = await request.get('/health');
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual({ status: 'up' });
    });

    test('User signup - positive', async ({ request }) => {
        const res = await request.post('/signup', { data: testUser });
        expect([200, 201, 409]).toContain(res.status());
    });

    test('User signup - negative (duplicate)', async ({ request }) => {
        const res = await request.post('/signup', { data: testUser });
        expect([400, 409]).toContain(res.status());
    });

    test('User login - positive', async ({ request }) => {
        const res = await request.post('/login', { data: testUser });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('access_token');
        token = body.access_token;
    });

    test('User login - negative (wrong password)', async ({ request }) => {
        const res = await request.post('/login', { data: invalidUser });
        expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('Create book - unauthorized', async ({ request }) => {
        const res = await request.post('/books/', {
            data: {
                name: 'Test Book',
                author: 'Test Author',
                published_year: 2024,
                book_summary: 'A test book.'
            }
        });
        expect([401, 403]).toContain(res.status());
    });

    test('Create book - invalid data', async ({ request }) => {
        const res = await request.post('/books/', {
            data: {
                name: '',
                author: '',
                published_year: 'not-a-year',
                book_summary: ''
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('Create book - positive', async ({ request }) => {
        const res = await request.post('/books/', {
            data: {
                name: 'Test Book',
                author: 'Test Author',
                published_year: 2024,
                book_summary: 'A test book.'
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('id');
        bookId = body.id;
    });

    test('Get book - unauthorized', async ({ request }) => {
        const res = await request.get(`/books/${bookId}`);
        expect([401, 403]).toContain(res.status());
    });

    test('Get book - positive', async ({ request }) => {
        const res = await request.get(`/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(bookId);
    });

    test('Get book - not found', async ({ request }) => {
        const res = await request.get(`/books/999999`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect([404, 403]).toContain(res.status());
    });

    test('Update book - unauthorized', async ({ request }) => {
        const res = await request.put(`/books/${bookId}`, {
            data: {
                name: 'Updated Book',
                author: 'Test Author',
                published_year: 2025,
                book_summary: 'Updated summary.'
            }
        });
        expect([401, 403]).toContain(res.status());
    });

    test('Update book - positive', async ({ request }) => {
        const res = await request.put(`/books/${bookId}`, {
            data: {
                name: 'Updated Book',
                author: 'Test Author',
                published_year: 2025,
                book_summary: 'Updated summary.'
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.name).toBe('Updated Book');
    });

    test('Update book - not found', async ({ request }) => {
        const res = await request.put(`/books/999999`, {
            data: {
                name: 'Updated Book',
                author: 'Test Author',
                published_year: 2025,
                book_summary: 'Updated summary.'
            },
            headers: { Authorization: `Bearer ${token}` }
        });
        expect([404, 403]).toContain(res.status());
    });

    test('Delete book - unauthorized', async ({ request }) => {
        const res = await request.delete(`/books/${bookId}`);
        expect([401, 403]).toContain(res.status());
    });

    test('Delete book - positive', async ({ request }) => {
        const res = await request.delete(`/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect([200, 204]).toContain(res.status());
    });

    test('Delete book - not found', async ({ request }) => {
        const res = await request.delete(`/books/999999`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect([404, 403]).toContain(res.status());
    });

    test('Get deleted book (should fail)', async ({ request }) => {
        const res = await request.get(`/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect([404, 403]).toContain(res.status());
    });
});