import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import UsersListPage from '../pages/UsersListPage'

// Mock the useUsers hook with more realistic data
const mockSetQuery = vi.fn()
vi.mock('../service', () => ({
  useUsers: () => ({
    query: { page: 1, pageSize: 10, sortBy: 'id', order: 'desc', status: 'all', q: '' },
    setQuery: mockSetQuery,
    data: {
      items: [
        { id: 1, email: 'admin@example.com', name: 'Admin User', roles: ['admin'], status: 'active', created_at: '2023-01-01' },
        { id: 2, email: 'admin2@example.com', name: 'Admin User 2', roles: ['admin'], status: 'active', created_at: '2023-01-02' },
        { id: 3, email: 'manager@example.com', name: 'Manager User', roles: ['manager'], status: 'active', created_at: '2023-01-03' },
        { id: 4, email: 'manager2@example.com', name: 'Manager User 2', roles: ['manager'], status: 'inactive', created_at: '2023-01-04' },
        { id: 5, email: 'user@example.com', name: 'Regular User', roles: ['user'], status: 'active', created_at: '2023-01-05' },
        { id: 6, email: 'user2@example.com', name: 'Regular User 2', roles: ['user'], status: 'inactive', created_at: '2023-01-06' },
        { id: 7, email: 'user3@example.com', name: 'Regular User 3', roles: ['user'], status: 'active', created_at: '2023-01-07' },
        { id: 8, email: 'user4@example.com', name: 'Regular User 4', roles: ['user'], status: 'active', created_at: '2023-01-08' },
        { id: 9, email: 'user5@example.com', name: 'Regular User 5', roles: ['user'], status: 'inactive', created_at: '2023-01-09' },
        { id: 10, email: 'user6@example.com', name: 'Regular User 6', roles: ['user'], status: 'active', created_at: '2023-01-10' },
        { id: 11, email: 'user7@example.com', name: 'Regular User 7', roles: ['user'], status: 'active', created_at: '2023-01-11' },
        { id: 12, email: 'user8@example.com', name: 'Regular User 8', roles: ['user'], status: 'active', created_at: '2023-01-12' },
        { id: 13, email: 'user9@example.com', name: 'Regular User 9', roles: ['user'], status: 'active', created_at: '2023-01-13' },
        { id: 14, email: 'user10@example.com', name: 'Regular User 10', roles: ['user'], status: 'active', created_at: '2023-01-14' },
        { id: 15, email: 'user11@example.com', name: 'Regular User 11', roles: ['user'], status: 'active', created_at: '2023-01-15' },
      ],
      total: 15,
      page: 1,
      pageSize: 10,
    },
    loading: false,
    err: '',
    refetch: vi.fn(),
  }),
}))

// Mock the columns factory
vi.mock('../columns', () => ({
  default: () => [
    { key: 'id', header: 'ID', sortable: true, width: 80 },
    { key: 'email', header: 'Email', sortable: true, width: 180 },
    { key: 'name', header: '이름', sortable: true, width: 160 },
    { key: 'roles', header: '역할', width: 200 },
    { key: 'status', header: '상태', width: 110 },
    { key: 'created_at', header: '가입일', sortable: true, width: 200 },
    { key: 'actions', header: '관리', width: 140 },
  ],
}))

// Mock the API functions
vi.mock('../api', () => ({
  exportCsv: vi.fn(),
}))

// Mock the modal components
vi.mock('../components/UserDetailModal', () => ({
  default: () => <div data-testid="user-detail-modal">User Detail Modal</div>,
}))

vi.mock('../components/UserRoleModal', () => ({
  default: () => <div data-testid="user-role-modal">User Role Modal</div>,
}))

vi.mock('../components/UserCreateModal', () => ({
  default: () => <div data-testid="user-create-modal">User Create Modal</div>,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UsersListPage', () => {
  beforeEach(() => {
    mockSetQuery.mockClear()
  })

  it('renders page title and description', () => {
    renderWithRouter(<UsersListPage />)
    
    expect(screen.getByText('All Users')).toBeInTheDocument()
    expect(screen.getByText('사용자 계정 및 권한 관리')).toBeInTheDocument()
  })

  it('displays total users count', () => {
    renderWithRouter(<UsersListPage />)
    
    expect(screen.getByText('Total Users: 15')).toBeInTheDocument()
  })

  it('renders role-based statistics cards', () => {
    renderWithRouter(<UsersListPage />)
    
    // Check if all role cards are rendered
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Admin Users')).toBeInTheDocument()
    expect(screen.getByText('Manager Users')).toBeInTheDocument()
    expect(screen.getByText('Regular Users')).toBeInTheDocument()
  })

  it('displays correct role counts', () => {
    renderWithRouter(<UsersListPage />)
    
    // Check specific role counts by looking for the parent containers
    const adminCard = screen.getByText('Admin Users').closest('div')
    const managerCard = screen.getByText('Manager Users').closest('div')
    const regularCard = screen.getByText('Regular Users').closest('div')
    
    expect(adminCard).toHaveTextContent('2') // 2 admin users
    expect(managerCard).toHaveTextContent('2') // 2 manager users
    expect(regularCard).toHaveTextContent('11') // 11 regular users
  })

  it('renders user list section', () => {
    renderWithRouter(<UsersListPage />)
    
    expect(screen.getByText('사용자 목록')).toBeInTheDocument()
  })

  it('renders search and filter controls', () => {
    renderWithRouter(<UsersListPage />)
    
    expect(screen.getByPlaceholderText('이메일/이름 검색')).toBeInTheDocument()
    expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    renderWithRouter(<UsersListPage />)
    
    expect(screen.getByText('추가')).toBeInTheDocument()
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  // 새로운 테스트 케이스들 - 실제 동작을 테스트
  describe('Role Filter Functionality', () => {
    it('calls setQuery when admin card is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const adminCard = screen.getByText('Admin Users').closest('div')
      await user.click(adminCard!)
      
      // setQuery가 호출되었는지 확인
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'all',
        q: ''
      })
    })

    it('calls setQuery when manager card is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const managerCard = screen.getByText('Manager Users').closest('div')
      await user.click(managerCard!)
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'all',
        q: ''
      })
    })

    it('calls setQuery when regular card is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const regularCard = screen.getByText('Regular Users').closest('div')
      await user.click(regularCard!)
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'all',
        q: ''
      })
    })

    it('calls setQuery when total users card is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const totalCard = screen.getByText('Total Users').closest('div')
      await user.click(totalCard!)
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'all',
        q: ''
      })
    })
  })

  describe('Status Filter Functionality', () => {
    it('calls setQuery when status filter is changed to active', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const statusSelect = screen.getByDisplayValue('전체')
      await user.selectOptions(statusSelect, 'active')
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'active',
        q: ''
      })
    })

    it('calls setQuery when status filter is changed to inactive', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const statusSelect = screen.getByDisplayValue('전체')
      await user.selectOptions(statusSelect, 'inactive')
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'inactive',
        q: ''
      })
    })
  })

  describe('Search Functionality', () => {
    it('calls setQuery when search input is typed', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const searchInput = screen.getByPlaceholderText('이메일/이름 검색')
      await user.type(searchInput, 'admin')
      
      // setQuery가 호출되었는지 확인 (여러 번 호출될 수 있음)
      expect(mockSetQuery).toHaveBeenCalled()
      
      // 마지막 호출에서 q 값이 포함되어 있는지 확인
      const lastCall = mockSetQuery.mock.calls[mockSetQuery.mock.calls.length - 1][0]
      expect(lastCall.q).toBe('n') // 마지막 문자
      expect(lastCall.page).toBe(1) // 페이지가 1로 리셋되는지 확인
    })
  })

  describe('Pagination Logic', () => {
    it('calls setQuery with page 1 when filter is applied', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const adminCard = screen.getByText('Admin Users').closest('div')
      await user.click(adminCard!)
      
      // 페이지가 1로 리셋되는지 확인
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'all',
        q: ''
      })
    })

    it('calls setQuery with page 1 when status filter is applied', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const statusSelect = screen.getByDisplayValue('전체')
      await user.selectOptions(statusSelect, 'active')
      
      expect(mockSetQuery).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'id',
        order: 'desc',
        status: 'active',
        q: ''
      })
    })

    it('calls setQuery with page 1 when search is applied', async () => {
      const user = userEvent.setup()
      renderWithRouter(<UsersListPage />)
      
      const searchInput = screen.getByPlaceholderText('이메일/이름 검색')
      await user.type(searchInput, 'test')
      
      // setQuery가 호출되었는지 확인
      expect(mockSetQuery).toHaveBeenCalled()
      
      // 마지막 호출에서 페이지가 1로 리셋되는지 확인
      const lastCall = mockSetQuery.mock.calls[mockSetQuery.mock.calls.length - 1][0]
      expect(lastCall.page).toBe(1)
      expect(lastCall.q).toBe('t') // 마지막 문자
    })
  })

  describe('Component Rendering', () => {
    it('renders all filter controls correctly', () => {
      renderWithRouter(<UsersListPage />)
      
      // 모든 필터 컨트롤이 렌더링되는지 확인
      expect(screen.getByPlaceholderText('이메일/이름 검색')).toBeInTheDocument()
      expect(screen.getByDisplayValue('전체')).toBeInTheDocument()
      expect(screen.getByText('추가')).toBeInTheDocument()
      expect(screen.getByText('CSV')).toBeInTheDocument()
    })

    it('renders all role cards correctly', () => {
      renderWithRouter(<UsersListPage />)
      
      // 모든 역할 카드가 렌더링되는지 확인
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('Admin Users')).toBeInTheDocument()
      expect(screen.getByText('Manager Users')).toBeInTheDocument()
      expect(screen.getByText('Regular Users')).toBeInTheDocument()
    })

    it('displays correct user counts', () => {
      renderWithRouter(<UsersListPage />)
      
      // 사용자 수가 올바르게 표시되는지 확인
      expect(screen.getByText('Total Users: 15')).toBeInTheDocument()
      
      // 각 역할별 사용자 수 확인
      const adminCard = screen.getByText('Admin Users').closest('div')
      const managerCard = screen.getByText('Manager Users').closest('div')
      const regularCard = screen.getByText('Regular Users').closest('div')
      
      expect(adminCard).toHaveTextContent('2')
      expect(managerCard).toHaveTextContent('2')
      expect(regularCard).toHaveTextContent('11')
    })
  })
})
