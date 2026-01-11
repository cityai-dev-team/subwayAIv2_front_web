import { Card, Progress, Row, Col, Typography, Space } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { RegionSummary } from '../types';
import { getRiskColor } from '../utils/riskUtils';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Text } = Typography;

interface RegionCardsProps {
  regions: RegionSummary[];
}

export default function RegionCards({ regions }: RegionCardsProps) {
  const displayRegions = regions.length > 0 
    ? regions.slice(0, 8) 
    : Array.from({ length: 8 }, (_, i) => ({
        region_id: String(i + 1),
        region_name: `구역 ${i + 1}`,
        avg_congestion_ratio: 0,
        cctv_count: 0,
        risk_level: '관심',
        risk_distribution: {
          심각: 0,
          경계: 0,
          주의: 0,
          관심: 0,
        },
      }));

  // 혼잡지속도별 색상 정의
  const COLORS = {
    심각: '#F5222D',
    경계: '#FA8C16',
    주의: '#FAAD14',
    관심: '#52C41A',
  };

  // Chart.js 데이터 생성 함수
  const getChartData = (distribution: { 심각: number; 경계: number; 주의: number; 관심: number }, total: number) => {
    const safeTotal = total > 0 ? total : 1;
    
    return {
      labels: ['혼잡지속도 분포'],
      datasets: [
        {
          label: '심각',
          data: [total > 0 ? (distribution.심각 / total) * 100 : 0],
          backgroundColor: COLORS.심각,
          borderWidth: 0,
        },
        {
          label: '경계',
          data: [total > 0 ? (distribution.경계 / total) * 100 : 0],
          backgroundColor: COLORS.경계,
          borderWidth: 0,
        },
        {
          label: '주의',
          data: [total > 0 ? (distribution.주의 / total) * 100 : 0],
          backgroundColor: COLORS.주의,
          borderWidth: 0,
        },
        {
          label: '관심',
          data: [total > 0 ? (distribution.관심 / total) * 100 : 0],
          backgroundColor: COLORS.관심,
          borderWidth: 0,
        },
      ],
    };
  };

  // Chart.js 옵션
  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.x || 0;
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
        backgroundColor: '#1f1f1f',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#404040',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        max: 100,
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        display: false,
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Row gutter={[16, 16]}>
      {displayRegions.map((region) => {
        const riskColor = getRiskColor(region.risk_level);
        const totalCCTVs = region.risk_distribution.심각 + 
                          region.risk_distribution.경계 + 
                          region.risk_distribution.주의 + 
                          region.risk_distribution.관심;
        
        return (
          <Col xs={24} sm={12} lg={6} key={region.region_id}>
            <Card
              variant="borderless"
              hoverable
              className="shadow-sm"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Text strong style={{ fontSize: '16px', color: '#ffffff' }}>
                    {region.region_name}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#bfbfbf' }}>
                    CCTV {region.cctv_count}개
                  </Text>
                </div>
              }
              styles={{ 
                header: {
                  background: '#1f1f1f',
                  borderBottom: 'none',
                  padding: '12px 16px'
                },
                body: {
                  padding: '16px',
                  background: '#2a2a2a',
                  color: '#ffffff'
                }
              }}
            >
              <div style={{ width: '100%', paddingTop: '8px' }}>
                {/* Chart.js 기반 가로 막대 차트 */}
                <div style={{ width: '100%', height: '50px', minHeight: '50px', marginBottom: '8px' }}>
                  <Bar 
                    data={getChartData(region.risk_distribution, totalCCTVs)} 
                    options={chartOptions}
                  />
                </div>
                {/* 혼잡지속도별 개수 표시 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', gap: '4px', flexWrap: 'wrap' }}>
                  <Text style={{ color: COLORS.심각, fontWeight: 500 }}>
                    심각 {region.risk_distribution.심각}개
                  </Text>
                  <Text style={{ color: COLORS.경계, fontWeight: 500 }}>
                    경계 {region.risk_distribution.경계}개
                  </Text>
                  <Text style={{ color: COLORS.주의, fontWeight: 500 }}>
                    주의 {region.risk_distribution.주의}개
                  </Text>
                  <Text style={{ color: COLORS.관심, fontWeight: 500 }}>
                    관심 {region.risk_distribution.관심}개
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
