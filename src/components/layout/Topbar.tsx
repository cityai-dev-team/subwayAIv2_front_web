// src/components/layout/Topbar.tsx
import { useState } from 'react';
import { APP_TITLE } from '../../shared/config/app';
import CongestionCriteriaModal from '../CongestionCriteriaModal';
import { Button } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

type Props = {
  onLogoClick: () => void;
};

export default function Topbar({
  onLogoClick,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="h-14 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          {/* 왼쪽: 빈 공간 (레이아웃 균형) */}
          <div style={{ width: '120px' }}></div>
          
          {/* 가운데: 로고와 혼잡도 리포팅 타이틀 */}
          <button
            onClick={onLogoClick}
            title="Go Home"
            aria-label="Go Home"
            className="absolute left-1/2 transform -translate-x-1/2 inline-flex items-center gap-3 select-none hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <img 
              src="/icon/logo.svg" 
              alt="로고" 
              className="w-auto h-auto flex-shrink-0"
              style={{ width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-semibold text-xl text-gray-900 tracking-tight whitespace-nowrap">
              {APP_TITLE}
            </span>
          </button>
          
          {/* 오른쪽: 혼잡도 기준 버튼 */}
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            혼잡도 기준
          </Button>
        </div>
      </header>
      
      <CongestionCriteriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
