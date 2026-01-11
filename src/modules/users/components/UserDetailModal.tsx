// src/modules/users/components/UserDetailModal.tsx
import { useEffect, useState } from 'react';
import { getUser, updateUser, toggleActive } from '../api';
import type { User, UpdateUserInput } from '../types';
import { X, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface UserDetailModalProps {
  isOpen: boolean;
  userId: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function UserDetailModal({ 
  isOpen, 
  userId, 
  onClose, 
  onSaved 
}: UserDetailModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setUser(null);
    setPwd('');
    setErr('');
    setShowPassword(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !userId) return;
    
    (async () => {
      try {
        const u = await getUser(userId);
        // 백엔드 응답의 active 필드를 status로 변환
        const transformedUser: User = {
          id: u.id,
          email: u.email,
          name: u.name || (u as any).full_name,
          phone: u.phone,
          roles: u.roles || [],
          status: (u as any).active ? 'active' : 'inactive',
          created_at: u.created_at,
          updated_at: u.updated_at,
          last_login_at: u.last_login_at,
        };
        setUser(transformedUser);
      } catch (e: any) {
        setErr(e?.message ?? '상세 조회 실패');
      }
    })();
  }, [isOpen, userId]);

  const onSave = async (patch: UpdateUserInput) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateUser(user.id, patch);
      setUser(updated);
      onSaved?.();
    } catch (e: any) {
      alert(e?.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!user || !pwd.trim()) return;
    setSaving(true);
    try {
      const updated = await updateUser(user.id, { password: pwd } as any);
      setUser(updated);
      setPwd('');
      onSaved?.();
      alert('비밀번호가 변경되었습니다.');
    } catch (e: any) {
      alert(e?.message ?? '비밀번호 변경 실패');
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await toggleActive(user.id);
      // 상태 토글 후 사용자 정보 다시 조회
      const updated = await getUser(user.id);
      const transformedUser: User = {
        id: updated.id,
        email: updated.email,
        name: updated.name || (updated as any).full_name,
        phone: updated.phone,
        roles: updated.roles || [],
        status: (updated as any).active ? 'active' : 'inactive',
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        last_login_at: updated.last_login_at,
      };
      setUser(transformedUser);
      onSaved?.();
    } catch (e: any) {
      alert(e?.message ?? '상태 변경 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // 로딩/에러 상태
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
              <h2 className="text-lg font-semibold text-gray-900">사용자 상세</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {err ? <div className="text-red-600">{err}</div> : '로딩 중...'}
          </div>
        </div>
      </div>
    );
  }

  const badge =
    user.status === 'active'
      ? 'inline-block rounded px-2 py-1 text-xs bg-green-100 text-green-700'
      : 'inline-block rounded px-2 py-1 text-xs bg-gray-200 text-gray-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">사용자 상세</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <div className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" 
              value={user.email} 
              disabled 
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={user.name ?? ''}
              placeholder="이름"
              onBlur={(e) => {
                const v = e.target.value;
                if (v !== (user.name ?? '')) onSave({ name: v });
              }}
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <div className="flex items-center gap-3">
              <span className={badge}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                className={`
                  ${user.status === 'active'
                    ? 'border-red-300 text-red-700 hover:bg-red-50'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                  }
                `}
                onClick={onToggleActive}
              >
                {user.status === 'active' ? '비활성화' : '활성화'}
              </Button>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 변경
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="새 비밀번호"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!pwd.trim() || saving}
                onClick={onChangePassword}
              >
                변경
              </Button>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
