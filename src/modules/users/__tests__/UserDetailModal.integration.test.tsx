import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { server } from '../../../test/mocks/server'
import { http, HttpResponse } from 'msw'
import UserDetailModal from '../components/UserDetailModal'

// Mock the API functions
vi.mock('../api', () => ({
  getUser: vi.fn().mockResolvedValue({
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['admin'],
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }),
  updateUser: vi.fn().mockResolvedValue({}),
  toggleActive: vi.fn().mockResolvedValue({}),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UserDetailModal Integration Tests', () => {
  it('should load user data and display correctly', async () => {
    renderWithRouter(
      <UserDetailModal 
        isOpen={true} 
        userId={1} 
        onClose={vi.fn()} 
        onSaved={vi.fn()} 
      />
    )
    
    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument()
    })
    
    // Check if user details are displayed
    expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should handle user status toggle', async () => {
    const user = userEvent.setup()
    const mockOnSaved = vi.fn()
    
    renderWithRouter(
      <UserDetailModal 
        isOpen={true} 
        userId={1} 
        onClose={vi.fn()} 
        onSaved={mockOnSaved} 
      />
    )
    
    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
    
    // Click toggle button
    const toggleButton = screen.getByText('비활성화')
    await user.click(toggleButton)
    
    // Should call toggle API and refresh data
    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalled()
    })
  })

  it('should handle password change', async () => {
    const user = userEvent.setup()
    
    renderWithRouter(
      <UserDetailModal 
        isOpen={true} 
        userId={1} 
        onClose={vi.fn()} 
        onSaved={vi.fn()} 
      />
    )
    
    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument()
    })
    
    // Type new password
    const passwordInput = screen.getByPlaceholderText('새 비밀번호')
    await user.type(passwordInput, 'newpassword123')
    
    // Click change button
    const changeButton = screen.getByText('변경')
    await user.click(changeButton)
    
    // Password should be cleared after successful change
    await waitFor(() => {
      expect(passwordInput).toHaveValue('')
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock getUser to throw an error
    const { getUser } = await import('../api')
    vi.mocked(getUser).mockRejectedValueOnce(new Error('User not found'))

    renderWithRouter(
      <UserDetailModal 
        isOpen={true} 
        userId={1} 
        onClose={vi.fn()} 
        onSaved={vi.fn()} 
      />
    )
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    
    renderWithRouter(
      <UserDetailModal 
        isOpen={true} 
        userId={1} 
        onClose={mockOnClose} 
        onSaved={vi.fn()} 
      />
    )
    
    // Wait for modal to load
    await waitFor(() => {
      expect(screen.getByText('사용자 상세')).toBeInTheDocument()
    })
    
    // Click close button (X button in header)
    const closeButton = screen.getByText('닫기')
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})
