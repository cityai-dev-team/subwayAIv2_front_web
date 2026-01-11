import { describe, it, expect } from 'vitest'

// 간단한 유틸리티 함수들 테스트
describe('Utility Functions', () => {
  describe('getInitials', () => {
    const getInitials = (nameOrEmail: string) => {
      const base = nameOrEmail.includes('@')
        ? nameOrEmail.split('@')[0]
        : nameOrEmail;
      const parts = base.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return base.slice(0, 2).toUpperCase();
    }

    it('should extract initials from email', () => {
      expect(getInitials('john.doe@example.com')).toBe('JO')
    })

    it('should extract initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('JO')
    })

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('')
    })
  })

  describe('User Status Helper', () => {
    const getUserStatusBadge = (status: string) => {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-700'
        case 'inactive':
          return 'bg-red-100 text-red-700'
        case 'pending':
          return 'bg-yellow-100 text-yellow-700'
        default:
          return 'bg-gray-100 text-gray-700'
      }
    }

    it('should return correct classes for active status', () => {
      expect(getUserStatusBadge('active')).toBe('bg-green-100 text-green-700')
    })

    it('should return correct classes for inactive status', () => {
      expect(getUserStatusBadge('inactive')).toBe('bg-red-100 text-red-700')
    })

    it('should return correct classes for pending status', () => {
      expect(getUserStatusBadge('pending')).toBe('bg-yellow-100 text-yellow-700')
    })

    it('should return default classes for unknown status', () => {
      expect(getUserStatusBadge('unknown')).toBe('bg-gray-100 text-gray-700')
    })
  })
})





