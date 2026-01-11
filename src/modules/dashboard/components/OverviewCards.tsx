import { Card, Statistic, Row, Col, Typography } from 'antd';
import type { OverviewStats } from '../types';

const { Title } = Typography;

interface OverviewCardsProps {
  overviewStats: OverviewStats;
}

export default function OverviewCards({ overviewStats }: OverviewCardsProps) {
  return (
    <Row gutter={[24, 24]}>
      {/* 혼잡지속도 그룹 - 혼잡지속도(밀집도+지속시간) 기준 */}
      <Col xs={24} md={12}>
        <Title level={5} className="mb-4 text-gray-700">혼잡지속도</Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>심각</span>}
                value={overviewStats.riskSummary.심각.count}
                valueStyle={{ color: '#ff1744', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>경계</span>}
                value={overviewStats.riskSummary.경계.count}
                valueStyle={{ color: '#ff6f00', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>주의</span>}
                value={overviewStats.riskSummary.주의.count}
                valueStyle={{ color: '#ffc400', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>관심</span>}
                value={overviewStats.riskSummary.관심.count}
                valueStyle={{ color: '#00c853', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </Col>

      {/* 혼잡도 그룹 */}
      <Col xs={24} md={12}>
        <Title level={5} className="mb-4 text-gray-700">혼잡도 (국토부 기준)</Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>심각</span>}
                value={overviewStats.congestionSummary?.심각?.count || 0}
                valueStyle={{ color: '#f5222d', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>혼잡</span>}
                value={overviewStats.congestionSummary?.혼잡?.count || 0}
                valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>주의</span>}
                value={overviewStats.congestionSummary?.주의?.count || 0}
                valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              variant="borderless"
              className="shadow-sm hover:shadow-md transition-shadow"
              styles={{ 
                body: {
                  padding: '20px',
                  background: '#f5f5f5'
                }
              }}
            >
              <Statistic
                title={<span style={{ color: '#000000', fontWeight: 'bold' }}>보통</span>}
                value={overviewStats.congestionSummary?.보통?.count || 0}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
