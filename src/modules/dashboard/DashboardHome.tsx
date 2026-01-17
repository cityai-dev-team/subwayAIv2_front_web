import { useEffect } from 'react';
import { Card, Typography, Spin, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import OverviewCards from './components/OverviewCards';
import RegionCards from './components/RegionCards';
import SevereCCTVList from './components/SevereCCTVList';
import { useDashboardData } from './hooks/useDashboardData';

const { Title, Text } = Typography;

export default function DashboardHome() {
  const {
    overviewStats,
    regions,
    loading,
    lastUpdated,
    fetchRegions,
    fetchDashboardData,
  } = useDashboardData();

  useEffect(() => {
    // 초기: 구역 구조 먼저 로드
    fetchRegions().then(() => {
      // 구역 구조 로드 후 데이터 로드
      fetchDashboardData();
    });
    
    // 이후 주기적 업데이트 (15초마다)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRegions, fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ padding: '24px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large">
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div>데이터를 불러오는 중...</div>
          </div>
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        {/* 왼쪽: 타이틀 */}
        <div style={{ flex: 1 }}>
          <Title level={2} style={{ margin: 0 }}>종합 모니터링</Title>
        </div>
        
        {/* 오른쪽: 마지막 업데이트 */}
        <div style={{ flexShrink: 0, marginLeft: '24px' }}>
          <Space>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              마지막 업데이트: {dayjs(lastUpdated).format('YYYY. M. D. A h:mm:ss')}
            </Text>
          </Space>
        </div>
      </div>

      {/* 전체 현황 카드 */}
      <Card 
        variant="borderless" 
        style={{ marginBottom: '24px' }}
        styles={{ body: { padding: '24px' } }}
      >
        <OverviewCards overviewStats={overviewStats} />
      </Card>

      {/* 구역별 현황 */}
      <Card 
        variant="borderless"
        title={<Title level={4} style={{ margin: 0 }}>구역별 현황(CCTV 혼잡지속도 분포)</Title>}
        styles={{ body: { padding: '24px' } }}
      >
        <RegionCards regions={regions} />
      </Card>

      {/* 혼잡지속도 심각 CCTV 목록 */}
      <Card 
        variant="borderless"
        title={<Title level={4} style={{ margin: 0 }}>혼잡지속도 심각 CCTV (최근 5분간)</Title>}
        styles={{ body: { padding: '24px' } }}
        style={{ marginTop: '24px' }}
      >
        <SevereCCTVList />
      </Card>
    </div>
  );
}
