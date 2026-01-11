import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Row, Col, Progress } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { getRiskColor } from './utils/riskUtils';

const { Title, Text } = Typography;

interface CCTVData {
  cctv_id: string;
  cctv_name: string;
  region_id: string;
  region_name: string;
  traffic: number;  // 게이지에 사용할 값 (최대 100명)
  risk_level: string;  // 아이콘 색상에 사용
}

export default function CCTVMonitoring() {
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [cctvData, setCctvData] = useState<Record<string, CCTVData[]>>({});
  const [regions, setRegions] = useState<Array<{ uid: number; region_id: string; region_name: string }>>([]);
  const [cctvStructure, setCctvStructure] = useState<Record<string, Array<{ cctv_id: string; cctv_name: string; region_id: string; region_name: string }>>>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // 혼잡도 레벨 - API에서 받은 데이터를 그대로 사용 (계산하지 않음)
  // API에서 congestion_level_molit 필드로 혼잡도 레벨을 제공해야 함
  const getCongestionLevel = (molitLevel?: string): '보통' | '주의' | '혼잡' | '심각' => {
    if (!molitLevel) return '보통';
    if (molitLevel === '보통' || molitLevel === '주의' || molitLevel === '혼잡' || molitLevel === '심각') {
      return molitLevel;
    }
    return '보통'; // 기본값
  };

  // 혼잡도 레벨에 따른 색상
  const getCongestionLevelColor = (level: '보통' | '주의' | '혼잡' | '심각'): string => {
    switch (level) {
      case '심각':
        return '#f5222d';
      case '혼잡':
        return '#fa8c16';
      case '주의':
        return '#faad14';
      case '보통':
        return '#52c41a';
      default:
        return '#52c41a';
    }
  };

  // 구간별 색상 (더 명확하고 밝은 색상)
  const getRegionCardColor = (regionName: string, index: number): { background: string; border: string } => {
    // 승강장외선은 빨간색이 아닌 다른 색상 사용
    if (regionName && regionName.includes('승강장외선')) {
      return { background: '#2f54eb', border: '#597ef7' }; // 밝은 인디고 블루
    }
    
    const colors = [
      { background: '#1890ff', border: '#40a9ff' },      // 구역 1: 밝은 블루
      { background: '#52c41a', border: '#73d13d' },      // 구역 2: 밝은 그린
      { background: '#722ed1', border: '#9254de' },      // 구역 3: 밝은 퍼플
      { background: '#fa8c16', border: '#ffa940' },      // 구역 4: 밝은 오렌지
      { background: '#eb2f96', border: '#f759ab' },      // 구역 5: 밝은 핑크
      { background: '#13c2c2', border: '#36cfc9' },      // 구역 6: 밝은 시안
      { background: '#faad14', border: '#ffc53d' },      // 구역 7: 밝은 옐로우 (레드 대신)
      { background: '#2f54eb', border: '#597ef7' },     // 구역 8: 밝은 인디고 블루
    ];
    return colors[index % colors.length];
  };

  // 초기 구조 설정 (구역 + CCTV 목록)
  useEffect(() => {
    const fetchStructure = async () => {
      setLoading(true);
      try {
        // 구역 목록 가져오기 (region_summary 테이블)
        const regionsRes = await api.get<{ regions: Array<{ uid: number; region_id: string; region_name: string }> }>('/report/setting/getRegions');
        console.log('Regions API Response:', regionsRes);
        console.log('Regions API Response (stringified):', JSON.stringify(regionsRes, null, 2));
        
        let regionList: Array<{ uid: number; region_id: string; region_name: string }> = [];
        
        if (regionsRes && regionsRes.regions && Array.isArray(regionsRes.regions) && regionsRes.regions.length > 0) {
          regionList = regionsRes.regions.map(r => {
            // region_id를 문자열로 통일
            const regionId = r.region_id ? String(r.region_id) : String(r.uid);
            // region_name이 있으면 우선 사용 (빈 문자열이 아닌 경우)
            const regionName = (r.region_name && r.region_name.trim()) ? r.region_name.trim() : (r.region_id || `구역 ${r.uid}`);
            console.log(`Region mapping: uid=${r.uid}, region_id=${r.region_id}, region_name="${r.region_name}" -> final: region_id="${regionId}", region_name="${regionName}"`);
            return {
              uid: r.uid,
              region_id: regionId,
              region_name: regionName,
            };
          });
          console.log(`Successfully loaded ${regionList.length} regions from API`);
        } else {
          console.warn('No regions found in API response or empty array, using default regions');
          // 구역이 없으면 기본 8개 구역 생성 (임시)
          regionList = Array.from({ length: 8 }, (_, i) => ({
            uid: i + 1,
            region_id: String(i + 1),
            region_name: `구역 ${i + 1}`,
          }));
        }
        
        console.log('Final region list:', regionList);
        setRegions(regionList);

        // CCTV 목록 구조만 가져오기 (cctv 테이블)
        const cctvRes = await api.get<{ status: string; data: Array<{ 
          cctv_uid: number; 
          cctv_id: string; 
          cctv_kr_name: string; 
          region_summary_id?: number;
          region_uid?: number;
          region_id?: string; 
          region_name?: string;
        }> }>('/report/setting/cctvs');
        console.log('CCTV API Response:', cctvRes);
        
        // 구역별로 CCTV 구조 그룹화
        const structure: Record<string, Array<{ cctv_id: string; cctv_name: string; region_id: string; region_name: string }>> = {};
        const cctvList = (cctvRes && cctvRes.data && Array.isArray(cctvRes.data)) ? cctvRes.data : [];
        console.log('CCTV list:', cctvList);
        console.log('CCTV list length:', cctvList.length);
        if (cctvList.length > 0) {
          console.log('Sample CCTV item:', cctvList[0]);
          console.log('Unique region_ids in CCTV list:', [...new Set(cctvList.map(c => c.region_id).filter(Boolean))]);
          console.log('Unique region_names in CCTV list:', [...new Set(cctvList.map(c => c.region_name).filter(Boolean))]);
        }
        
        regionList.forEach(region => {
          // region_id로 매칭 (cctv.region_id === region.region_id)
          // region_id를 문자열로 통일하여 비교
          const targetRegionId = String(region.region_id).trim();
          
          const regionCCTVs = cctvList
            .filter(cctv => {
              // region_id로 매칭 (모두 문자열로 변환하여 비교)
              const cctvRegionId = cctv.region_id ? String(cctv.region_id).trim() : null;
              const match = cctvRegionId === targetRegionId;
              
              if (match) {
                console.log(`✓ Matched: CCTV ${cctv.cctv_id} (region_id="${cctvRegionId}") -> Region ${targetRegionId} (${region.region_name})`);
              } else if (cctvRegionId) {
                // 매칭 실패한 경우만 로그 (너무 많을 수 있으므로)
                // console.log(`✗ Mismatch: CCTV ${cctv.cctv_id} region_id="${cctvRegionId}" vs target="${targetRegionId}"`);
              }
              return match;
            })
            .map(cctv => ({
              cctv_id: cctv.cctv_id || '',
              cctv_name: cctv.cctv_kr_name || cctv.cctv_id || '',
              region_id: region.region_id,
              region_name: region.region_name,
            }));
          
          console.log(`Region ${region.region_id} (${region.region_name}): Found ${regionCCTVs.length} CCTV(s)`);
          if (regionCCTVs.length > 0) {
            console.log(`  CCTV IDs: ${regionCCTVs.map(c => c.cctv_id).join(', ')}`);
          }
          
          // CCTV가 없어도 구역은 구조에 포함 (빈 배열로)
          structure[region.region_id] = regionCCTVs;
        });
        
        console.log('CCTV Structure:', structure);
        setCctvStructure(structure);
        
        // 초기 구조로 데이터 초기화 (0으로 초기화, 혼잡지속도 업데이트에서 값 채움)
        const initialData: Record<string, CCTVData[]> = {};
        Object.keys(structure).forEach(regionId => {
          initialData[regionId] = structure[regionId].map((cctv) => {
            return {
              ...cctv,
              traffic: 0,
              risk_level: '관심',
            };
          });
        });
        console.log('Initial CCTV Data:', initialData);
        setCctvData(initialData);
        setInitialLoad(false);
      } catch (error) {
        console.error('Failed to fetch CCTV structure:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // 에러 발생 시 기본 구역 설정
        const defaultRegions = Array.from({ length: 8 }, (_, i) => ({
          uid: i + 1,
          region_id: String(i + 1),
          region_name: `구역 ${i + 1}`,
        }));
        console.warn('Using default regions due to API error');
        setRegions(defaultRegions);
        setCctvStructure({});
        setCctvData({});
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, []);

  // CCTV별 데이터 업데이트 (15초마다) - median_level과 risk_level 업데이트
  useEffect(() => {
    if (initialLoad || Object.keys(cctvStructure).length === 0) return;

    const updateCCTVData = async () => {
      try {
        // CCTV 목록 조회 (traffic과 risk_level 포함)
        const cctvListRes = await api.get<{ 
          congestion_list: Array<{ 
            cctv_id: string;
            cctv_kr_name: string;
            cctv_uid: number;
            region_id?: string;
            region_name?: string;
            traffic_in: number;
            traffic_out: number;
            traffic: number;
            risk_level: string;
          }> 
        }>('/report/setting/getCCTVList');
        
        const cctvList = cctvListRes.congestion_list || [];
        
        // 기존 구조를 유지하면서 CCTV별 데이터 업데이트
        const updatedData: Record<string, CCTVData[]> = {};
        
        Object.keys(cctvStructure).forEach(regionId => {
          updatedData[regionId] = cctvStructure[regionId].map(cctv => {
            // 해당 CCTV의 데이터 찾기
            const cctvData = cctvList.find(
              (item) => item.cctv_id === cctv.cctv_id
            );
            
            if (cctvData) {
              return {
                ...cctv,
                traffic: cctvData.traffic || 0,
                risk_level: cctvData.risk_level || '관심',
              };
            } else {
              // 데이터가 없으면 기본값
              return {
                ...cctv,
                traffic: 0,
                risk_level: '관심',
              };
            }
          });
        });
        
        setCctvData(updatedData);
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('Failed to update CCTV data:', error);
      }
    };

    // 초기 업데이트
    updateCCTVData();
    
    // 15초마다 CCTV 데이터 업데이트
    const interval = setInterval(updateCCTVData, 15000);
    return () => clearInterval(interval);
  }, [initialLoad, cctvStructure]);

  if (loading && initialLoad) {
    return (
      <div style={{ padding: '24px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="데이터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>CCTV별 모니터링</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <Text type="secondary">
            실시간 CCTV별 혼잡도를 종합적으로 나타낸 모니터링
          </Text>
          {lastUpdateTime && (() => {
            const year = lastUpdateTime.getFullYear();
            const month = lastUpdateTime.getMonth() + 1;
            const day = lastUpdateTime.getDate();
            const hours = lastUpdateTime.getHours();
            const minutes = lastUpdateTime.getMinutes().toString().padStart(2, '0');
            const seconds = lastUpdateTime.getSeconds().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            return (
              <Text type="secondary" style={{ fontSize: '12px', color: '#8c8c8c' }}>
                마지막 업데이트: {year}. {month}. {day}. {ampm} {displayHours}:{minutes}:{seconds}
              </Text>
            );
          })()}
        </div>
      </div>

      {regions.length === 0 ? (
        <Card variant="borderless">
          <Text type="secondary">구역 데이터가 없습니다.</Text>
        </Card>
      ) : (
        <Card variant="borderless" styles={{ body: { padding: '24px' } }}>
          <Row gutter={[8, 8]} style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
            {regions.map((region, regionIndex) => {
              const cctvs = cctvData[region.region_id] || [];
              const regionColor = getRegionCardColor(region.region_name, regionIndex);
              
              // 해당 구역의 전체 인원 합계 계산
              const totalTraffic = cctvs.reduce((sum, cctv) => sum + (cctv.traffic || 0), 0);
              const maxTraffic = 3000;  // 구역 카드 최대값: 3000명
              const trafficPercent = Math.min(100, Math.max(0, (totalTraffic / maxTraffic) * 100));
              
              return (
                <React.Fragment key={region.region_id}>
                  {/* 구역명 카드 - 앞에 배치 (CCTV 카드와 동일한 크기) */}
                  <Col xs={24} sm={24} md={24} lg={24} style={{ maxWidth: 'calc(14.285% - 6.86px)', flex: '0 0 calc(14.285% - 6.86px)', minWidth: 'calc(14.285% - 6.86px)' }}>
                    <Card
                      variant="borderless"
                      style={{ 
                        height: '100px',
                        width: '100%',
                        background: regionColor.background,
                        border: `2px solid ${regionColor.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                      styles={{
                        body: {
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%'
                        }
                      }}
                    >
                      <Text strong style={{ fontSize: '22px', color: '#ffffff', textAlign: 'center', marginBottom: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {region.region_name}
                      </Text>
                      <div style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <Progress
                            percent={trafficPercent}
                            strokeColor="#ffffff"
                            trailColor="rgba(255,255,255,0.3)"
                            showInfo={false}
                            strokeWidth={16}
                            size="default"
                          />
                        </div>
                        <Text style={{ 
                          fontSize: '22px', 
                          color: '#ffffff', 
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          minWidth: '65px',
                          textAlign: 'right',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {totalTraffic}명
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* CCTV 카드들 - 뒤에 연속적으로 붙음 (한 줄에 7개씩) */}
                  {cctvs.length === 0 ? (
                    <Col xs={24} sm={24} md={24} lg={24} style={{ maxWidth: 'calc(14.285% - 6.86px)', flex: '0 0 calc(14.285% - 6.86px)', minWidth: 'calc(14.285% - 6.86px)' }}>
                      <Card
                        variant="borderless"
                        style={{ height: '100px', background: '#0d1b2a', border: '1px solid #1a2b3c' }}
                        styles={{
                          body: {
                            padding: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                          }
                        }}
                      >
                        <Text type="secondary" style={{ color: '#8c8c8c' }}>CCTV 없음</Text>
                      </Card>
                    </Col>
                  ) : (
                    cctvs.map(cctv => {
                      const riskColor = getRiskColor(cctv.risk_level);
                      // traffic 값을 게이지 값으로 사용 (최대 300명 기준으로 퍼센트 계산)
                      const maxTraffic = 300;
                      const trafficValue = typeof cctv.traffic === 'number' ? cctv.traffic : 0;
                      const percent = Math.min(100, Math.max(0, (trafficValue / maxTraffic) * 100));
                      
                      // CCTV 카드는 종합 모니터링과 동일한 색상으로 통일
                      const headerBgColor = '#1f1f1f'; // 종합 모니터링과 동일
                      const bodyBgColor = '#2a2a2a'; // 종합 모니터링과 동일
                      const borderColor = '#3a3a3a'; // 테두리 색상
                      // 배경 게이지 색상 (명확하게 보이도록 밝은 회색)
                      const trailColor = '#3a4a5d';

                      return (
                        <Col xs={24} sm={24} md={24} lg={24} key={cctv.cctv_id} style={{ maxWidth: 'calc(14.285% - 6.86px)', flex: '0 0 calc(14.285% - 6.86px)', minWidth: 'calc(14.285% - 6.86px)' }}>
                          <Card
                            variant="borderless"
                            hoverable
                            className="shadow-sm"
                            style={{ 
                              height: '100px',
                              border: `1px solid ${borderColor}`,
                              width: '100%'
                            }}
                            title={
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Text strong style={{ fontSize: '16px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {cctv.cctv_name}
                                </Text>
                                <WarningOutlined 
                                  style={{ 
                                    fontSize: '20px', 
                                    color: riskColor,  // risk_level 색상으로 아이콘 색상 설정
                                    flexShrink: 0,
                                    marginLeft: '6px'
                                  }} 
                                />
                              </div>
                            }
                            styles={{ 
                              header: {
                                background: headerBgColor,
                                borderBottom: `1px solid ${borderColor}`,
                                padding: '10px 14px',
                                minHeight: 'auto'
                              },
                              body: {
                                padding: '14px',
                                background: bodyBgColor,
                                color: '#ffffff',
                                height: 'calc(100px - 48px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }
                            }}
                          >
                            <div style={{ width: '100%', position: 'relative' }}>
                              <Progress
                                percent={percent}
                                strokeColor={riskColor}
                                trailColor={trailColor}
                                showInfo={true}
                                format={(percent) => (
                                  <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                                    {trafficValue}명
                                  </span>
                                )}
                                strokeWidth={10}
                                size="small"
                              />
                            </div>
                          </Card>
                        </Col>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
}

