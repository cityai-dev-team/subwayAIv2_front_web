// src/modules/users/components/UserRoleModal.tsx
import { useEffect, useState } from 'react';
import { assignRoles, getUser } from '../api';
import { X, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const ROLE_OPTIONS = ['admin', 'manager', 'user'] as const;

interface UserRoleModalProps {
  isOpen: boolean;
  userId: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function UserRoleModal({
  isOpen,
  userId,
  onClose,
  onSaved,
}: UserRoleModalProps) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleClose = () => {
    setRole('user');
    setErr('');
    setLoading(true);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !userId) return;
    
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const u = await getUser(userId);
        if (!alive) return;
        const current = (u.roles?.[0] as string) || 'user'; // 단일 역할만 사용
        setRole(current);
      } catch (e: any) {
        setErr(e?.message ?? '역할 조회 실패');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isOpen, userId]);

  async function onSave() {
    setSaving(true);
    setErr('');
    try {
      await assignRoles(userId, [role]);
      onSaved?.();
      handleClose();
    } catch (e: any) {
      setErr(e?.message ?? '역할 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">역할 변경</h2>
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
          {/* 에러 */}
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : (
            <>
              {/* 역할 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={opt}
                        checked={role === opt}
                        onChange={() => setRole(opt)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={saving}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
