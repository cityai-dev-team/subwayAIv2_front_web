import { useState } from 'react';
import { createUser } from '../api';
import { X, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const ROLE_OPTIONS = ['admin', 'manager', 'user'] as const;

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function UserCreateModal({
  isOpen,
  onClose,
  onSaved,
}: UserCreateModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('user');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleClose = () => {
    setEmail('');
    setName('');
    setRole('user');
    setErr('');
    onClose();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await createUser({ email, full_name: name || undefined, roles: [role], active: true });
      onSaved?.();
      handleClose();
    } catch (e: any) {
      const msg = e?.details?.detail || e?.message || '등록 실패';
      setErr(String(msg));
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
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">사용자 등록</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름(선택)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 역할 */}
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
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!email || saving}
            >
              {saving ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
