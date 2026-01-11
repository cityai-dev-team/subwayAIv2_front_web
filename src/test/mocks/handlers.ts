import { http, HttpResponse } from 'msw'

// Mock API handlers for testing
export const handlers = [
  // Users API
  http.get('/api/users', () => {
    return HttpResponse.json({
      items: [
        {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          roles: ['admin'],
          active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          last_login_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'manager@example.com',
          name: 'Manager User',
          roles: ['manager'],
          active: true,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          last_login_at: '2023-01-02T00:00:00Z',
        },
        {
          id: 3,
          email: 'user@example.com',
          name: 'Regular User',
          roles: ['user'],
          active: false,
          created_at: '2023-01-03T00:00:00Z',
          updated_at: '2023-01-03T00:00:00Z',
          last_login_at: '2023-01-03T00:00:00Z',
        },
      ],
      total: 3,
      page: 1,
      pageSize: 10,
    })
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    const users = [
      {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        last_login_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 2,
        email: 'manager@example.com',
        name: 'Manager User',
        roles: ['manager'],
        active: true,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        last_login_at: '2023-01-02T00:00:00Z',
      },
      {
        id: 3,
        email: 'user@example.com',
        name: 'Regular User',
        roles: ['user'],
        active: false,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
        last_login_at: '2023-01-03T00:00:00Z',
      },
    ]
    
    const user = users.find(u => u.id === parseInt(id as string))
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return HttpResponse.json(user)
  }),

  http.post('/api/users/:id/toggle-active', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ ok: true, active: true })
  }),

  http.post('/api/users', () => {
    return HttpResponse.json({
      id: 4,
      email: 'newuser@example.com',
      name: 'New User',
      roles: ['user'],
      active: true,
      created_at: '2023-01-04T00:00:00Z',
      updated_at: '2023-01-04T00:00:00Z',
      last_login_at: null,
    }, { status: 201 })
  }),

  http.patch('/api/users/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id: parseInt(id as string),
      email: 'updated@example.com',
      name: 'Updated User',
      roles: ['user'],
      active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-04T00:00:00Z',
      last_login_at: '2023-01-01T00:00:00Z',
    })
  }),

  http.put('/api/users/:id/roles', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ ok: true })
  }),

  // Auth API
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
    })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'admin@example.com',
      full_name: 'Admin User',
      roles: ['admin'],
    })
  }),
]





