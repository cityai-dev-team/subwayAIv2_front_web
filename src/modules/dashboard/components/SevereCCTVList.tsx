import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { api } from '../../../lib/api';
import { getRiskColor } from '../utils/riskUtils';

const { Text } = Typography;

interface SevereCCTV {
  cctv_id: string;
  cctv_kr_name: string;
  cctv_uid: number;
  region_name: string;
  severe_count: number;
}

export default function SevereCCTVList() {
  const [loading, setLoading] = useState(true);
  const [severeCCTVs, setSevereCCTVs] = useState<SevereCCTV[]>([]);

  useEffect(() => {
    const fetchSevereCCTVs = async () => {
      try {
        const response = await api.get<{
          severe_cctv_list: Array<{
            cctv_id: string;
            cctv_kr_name: string;
            cctv_uid: number;
            region_name: string;
            severe_count: number;
          }>;
        }>('/report/setting/getSevereCCTVCount');

        const severeList = (response.severe_cctv_list || []).map(cctv => ({
          cctv_id: cctv.cctv_id,
          cctv_kr_name: cctv.cctv_kr_name,
          cctv_uid: cctv.cctv_uid,
          region_name: cctv.region_name || '미지정',
          severe_count: cctv.severe_count || 0,
        }));

        // 항상 16개로 고정 (부족하면 빈 데이터로 채움)
        const fixedList: SevereCCTV[] = [];
        for (let i = 0; i < 16; i++) {
          if (i < severeList.length) {
            fixedList.push(severeList[i]);
          } else {
            fixedList.push({
              cctv_id: '',
              cctv_kr_name: '-',
              cctv_uid: -i - 1, // 고유한 음수 키
              region_name: '-',
              severe_count: 0,
            });
          }
        }

        setSevereCCTVs(fixedList);
      } catch (error) {
        console.error('Failed to fetch severe CCTV list:', error);
        // 에러 시에도 16개 빈 카드 유지
        const emptyList: SevereCCTV[] = Array.from({ length: 16 }, (_, i) => ({
          cctv_id: '',
          cctv_kr_name: '-',
          cctv_uid: -i - 1,
          region_name: '-',
          severe_count: 0,
        }));
        setSevereCCTVs(emptyList);
      } finally {
        setLoading(false);
      }
    };

    fetchSevereCCTVs();

    // 15초마다 업데이트
    const interval = setInterval(fetchSevereCCTVs, 15000);
    return () => clearInterval(interval);
  }, []);

  const riskColor = getRiskColor('심각');

  return (
    <Row gutter={[16, 16]}>
      {severeCCTVs.map((cctv, index) => {
        const isEmpty = cctv.cctv_uid < 0 || cctv.cctv_kr_name === '-';
        
        return (
          <Col xs={24} sm={12} lg={3} xl={3} key={cctv.cctv_uid || `empty-${index}`}>
            <Card
              variant="borderless"
              hoverable={!isEmpty}
              className="shadow-sm"
              styles={{
                body: {
                  padding: '16px',
                  background: isEmpty ? '#f5f5f5' : '#fff',
                  border: isEmpty ? '2px solid #d9d9d9' : `2px solid ${riskColor}`,
                  borderRadius: '8px',
                  opacity: isEmpty ? 0.5 : 1,
                },
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isEmpty && <WarningOutlined style={{ color: riskColor, fontSize: '18px' }} />}
                  <Text strong style={{ fontSize: '14px', flex: 1, color: isEmpty ? '#bfbfbf' : undefined }}>
                    {cctv.cctv_kr_name}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {cctv.region_name}
                  </Text>
                  {!isEmpty && (
                    <Text strong style={{ fontSize: '16px', color: riskColor }}>
                      {cctv.severe_count}회
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

