// import { useState } from 'react'; // 사용하지 않음
import { Modal, Tabs, Table, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CongestionCriteriaModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CongestionCriteriaModal({ open, onClose }: CongestionCriteriaModalProps) {
  // 혼잡도 (기본 방식) 테이블 데이터
  const basicCongestionColumns = [
    {
      title: '단계',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '보행로',
      dataIndex: 'pedestrian',
      key: 'pedestrian',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '계단',
      dataIndex: 'stairs',
      key: 'stairs',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '대기공간',
      dataIndex: 'waiting',
      key: 'waiting',
      width: 150,
      align: 'center' as const,
    },
  ];

  const basicCongestionData = [
    {
      key: '1',
      level: '하',
      pedestrian: '40% 미만',
      stairs: '50% 미만',
      waiting: '60% 미만',
    },
    {
      key: '2',
      level: '중',
      pedestrian: '40% 이상',
      stairs: '50% 이상',
      waiting: '60% 이상',
    },
    {
      key: '3',
      level: '상',
      pedestrian: '60% 이상',
      stairs: '70% 이상',
      waiting: '70% 이상',
    },
  ];

  // 혼잡도(국토부) 테이블 데이터
  const molitCongestionColumns = [
    {
      title: '단계',
      dataIndex: 'level',
      key: 'level',
      width: 150,
      align: 'center' as const,
      render: (text: string, _record: any) => {
        const colorMap: { [key: string]: string } = {
          '보통': '#52c41a',
          '주의': '#faad14',
          '혼잡': '#fa8c16',
          '심각': '#f5222d',
        };
        return (
          <span style={{ color: colorMap[text] || '#000', fontWeight: 'bold' }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '판단 기준',
      dataIndex: 'criteria',
      key: 'criteria',
      align: 'center' as const,
    },
  ];

  const molitCongestionData = [
    {
      key: '1',
      level: '보통',
      criteria: '130% 이하',
    },
    {
      key: '2',
      level: '주의',
      criteria: '130~150%',
    },
    {
      key: '3',
      level: '혼잡',
      criteria: '150~170%',
    },
    {
      key: '4',
      level: '심각',
      criteria: '170% 이상',
    },
  ];

  // 위험도 지속도 테이블 데이터
  const riskDurationColumns = [
    {
      title: '단계',
      dataIndex: 'level',
      key: 'level',
      width: 150,
      align: 'center' as const,
      render: (text: string, _record: any) => {
        const colorMap: { [key: string]: string } = {
          '관심': '#52c41a',
          '주의': '#faad14',
          '경계': '#fa8c16',
          '심각': '#f5222d',
        };
        return (
          <span style={{ color: colorMap[text] || '#000', fontWeight: 'bold' }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '판단 기준',
      dataIndex: 'criteria',
      key: 'criteria',
      align: 'center' as const,
    },
  ];

  const riskDurationData = [
    {
      key: '1',
      level: '관심',
      criteria: '-',
    },
    {
      key: '2',
      level: '주의',
      criteria: "'중' 이상이 3회 이상",
    },
    {
      key: '3',
      level: '경계',
      criteria: "'중' 이상이 5회 또는 '상' 3회 이상",
    },
    {
      key: '4',
      level: '심각',
      criteria: "'상' 5회",
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfoCircleOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>혼잡도 기준</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '혼잡도',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  최종 혼잡도(밀집도) 지표
                </Title>
                <Table
                  columns={basicCongestionColumns}
                  dataSource={basicCongestionData}
                  pagination={false}
                  bordered
                  size="middle"
                />
                
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '4px', fontSize: '14px', lineHeight: '1.8' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>혼잡비율 계산 방법:</div>
                  <div style={{ marginBottom: '4px' }}>• 15초 간격의 서비스 수준(LOS)를 숫자로 변환</div>
                  <div style={{ marginBottom: '4px' }}>• 1분 간격(4개의 값으로 묶어) 4번의 F를 최대혼집(100%)이라고 정의하고 1분 동안의 혼잡비율을 계산</div>
                </div>
                
                <div style={{ marginTop: '24px' }}>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    최종 혼잡지속도(밀집도+지속시간) 지표
                  </Title>
                  <Table
                    columns={riskDurationColumns}
                    dataSource={riskDurationData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'molit',
            label: '혼잡도(국토부)',
            children: (
              <div style={{ padding: '16px 0' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  국토교통부 방식 (혼잡도리포팅에 적용)
                </Title>
                
                {/* 계산 공식 섹션 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>승강장 혼잡도(%)</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      (대기공간 내 인원의 총합(인) / (2.35(인/m²) × 대기공간의 총합(m²))) × 100
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>계단 흐름 혼잡도(%)</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      (계단 흐름 계수(인/m·분) / 35(인/m·분)) × 100
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>환승 통로 흐름 혼잡도(%)</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      (환승 통로 흐름계수(인/m·분) / 70(인/m·분)) × 100
                    </div>
                  </div>
                </div>
                
                {/* 혼잡도 기준 테이블 */}
                <div style={{ marginTop: '24px' }}>
                  <Title level={5} style={{ marginBottom: '16px' }}>
                    혼잡도 기준
                  </Title>
                  <Table
                    columns={molitCongestionColumns}
                    dataSource={molitCongestionData}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}

