import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../../../lib/api';
import type { DashboardData, OverviewStats, RegionSummary } from '../types';
// import type { CCTVItem, CCTVListResponse } from '../types'; // 사용하지 않음
// import { getRiskLevelText } from '../utils/riskUtils'; // 사용하지 않음

export function useDashboardData() {
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalCCTVs: 0,
    activeCCTVs: 0,
    riskSummary: {
      심각: { count: 0, items: [] },
      경계: { count: 0, items: [] },
      주의: { count: 0, items: [] },
      관심: { count: 0, items: [] },
    },
    congestionSummary: {
      보통: { count: 0, items: [] },
      주의: { count: 0, items: [] },
      혼잡: { count: 0, items: [] },
      심각: { count: 0, items: [] },
    },
    avgCongestionRatio: 0,
  });
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [regionsInitialized, setRegionsInitialized] = useState(false); // 구역 구조 초기화 여부
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // 초기 로딩 여부
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const regionsRef = useRef<RegionSummary[]>([]); // 최신 regions 참조용

  // 구역 기본 정보만 조회 (구역명, CCTV 수)
  const fetchRegions = useCallback(async () => {
    try {
      const data = await api.get<{ regions: Array<{ uid: number; region_id: string; region_name: string; cctv_count: number }> }>('/report/setting/getRegions');
      console.log('Regions API Response:', data);
      
      const regionList: RegionSummary[] = (data.regions || []).map((region) => {
        return {
          region_id: String(region.region_id || region.uid),
          region_name: region.region_name || `구역 ${region.uid}`,
          avg_congestion_ratio: 0, // 초기값, 나중에 위험도 평균으로 업데이트
          cctv_count: region.cctv_count || 0,
          risk_level: '관심', // 초기값, 나중에 업데이트
          risk_distribution: {
            심각: 0,
            경계: 0,
            주의: 0,
            관심: 0,
          },
        };
      });
      
      // 8개 구역이 모두 있는지 확인하고, 없으면 기본값으로 채움
      for (let i = 1; i <= 8; i++) {
        const exists = regionList.some(r => parseInt(r.region_id) === i);
        if (!exists) {
          regionList.push({
            region_id: String(i),
            region_name: `구역 ${i}`,
            avg_congestion_ratio: 0,
            cctv_count: 0,
            risk_level: '관심',
            risk_distribution: {
              심각: 0,
              경계: 0,
              주의: 0,
              관심: 0,
            },
          });
        }
      }
      
      // uid 순서로 정렬
      regionList.sort((a, b) => parseInt(a.region_id) - parseInt(b.region_id));
      
      setRegions(regionList);
      regionsRef.current = regionList; // ref 업데이트
      setRegionsInitialized(true);
      
      // 각 구역별로 위험도 평균을 별도로 조회
      fetchRegionsRiskAverage(regionList);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      // 에러 발생 시 기본 8개 구역 생성
      const defaultRegions: RegionSummary[] = Array.from({ length: 8 }, (_, i) => ({
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
      setRegions(defaultRegions);
      setRegionsInitialized(true);
    }
  }, []);

  // 구역별 위험도 평균 조회 (한 번의 API 호출로 모든 구역 조회)
  const fetchRegionsRiskAverage = useCallback(async (_regionList: RegionSummary[]) => {
    try {
      // 한 번의 API 호출로 모든 구역의 위험도 평균 조회
      const response = await api.get<{ 
        regions: Array<{ 
          uid: number;
          region_id: string; 
          region_name: string;
          cctv_count: number;
          avg_risk_level: string; 
          avg_risk_level_num: number;
        }> 
      }>('/report/setting/getRegionsWithRiskAverage');
      
      const regionsData = response.regions || [];
      
      // 구역별 위험도 평균 업데이트
      setRegions((prevRegions) => {
        const updated = prevRegions.map((region) => {
          // API 응답에서 해당 구역 데이터 찾기 (region_id로 매칭)
          const regionData = regionsData.find(
            (r) => String(r.region_id) === region.region_id || String(r.uid) === region.region_id
          );
          
          if (regionData) {
            // 위험도 평균값을 게이지 값으로 변환 (1-4 범위를 0-100%로 변환)
            const gaugeValue = ((regionData.avg_risk_level_num - 1) / 3) * 100;
            
            return {
              ...region,
              avg_congestion_ratio: gaugeValue,
              risk_level: regionData.avg_risk_level || '관심',
              cctv_count: regionData.cctv_count || region.cctv_count,
            };
          }
          
          // 데이터가 없으면 기존 값 유지
          return region;
        });
        
        regionsRef.current = updated; // ref 업데이트
        return updated;
      });
    } catch (error) {
      console.error('Failed to fetch regions risk average:', error);
      // 에러 발생 시 기본값 유지
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    // 구역 구조가 초기화되지 않았으면 대기
    if (!regionsInitialized) {
      return;
    }
    
    // 초기 로딩이 아니면 loading 상태를 변경하지 않음 (백그라운드 업데이트)
    if (initialLoad) {
      setLoading(true);
    }
    try {
      const data = await api.get<DashboardData>('/report/getDashboardData');
      console.log('Dashboard Data API Response:', data);
      const allStations = Object.values(data.stations || {});
      
      // 데이터가 없거나 비어있으면 임의 값 생성
      if (allStations.length === 0) {
        const dummyTotalCCTVs = 45;
        const dummyActiveCCTVs = 42;
        
        setOverviewStats({
          totalCCTVs: dummyTotalCCTVs,
          activeCCTVs: dummyActiveCCTVs,
          riskSummary: {
            심각: { count: 5, items: ['구역1', '구역2'] },
            경계: { count: 8, items: ['구역3', '구역4'] },
            주의: { count: 12, items: ['구역5', '구역6'] },
            관심: { count: 17, items: ['구역7', '구역8'] },
          },
          congestionSummary: {
            보통: { count: 21, items: ['구역6', '구역7', '구역8'] },
            주의: { count: 15, items: ['구역3', '구역4', '구역5'] },
            혼잡: { count: 4, items: ['구역1'] },
            심각: { count: 2, items: ['구역2'] },
          },
          avgCongestionRatio: 125.5,
        });
        
        // 구역별 임의 값 생성
        setRegions((prevRegions) => {
          return prevRegions.map((region, index) => {
            const baseRatio = 80 + (index * 15) + Math.random() * 30;
            const congestionRatio = Math.min(200, Math.max(50, baseRatio));
            const riskLevels = ['관심', '주의', '경계', '심각'];
            const riskLevel = riskLevels[Math.floor((congestionRatio - 50) / 40)] || '관심';
            const cctvCount = 3 + Math.floor(Math.random() * 8);
            
            return {
              ...region,
              avg_congestion_ratio: Math.round(congestionRatio * 10) / 10,
              cctv_count: cctvCount,
              risk_level: riskLevel,
              risk_distribution: {
                심각: riskLevel === '심각' ? cctvCount : 0,
                경계: riskLevel === '경계' ? cctvCount : 0,
                주의: riskLevel === '주의' ? cctvCount : 0,
                관심: riskLevel === '관심' ? cctvCount : 0,
              },
            };
          });
        });
        
        setLastUpdated(new Date());
        if (initialLoad) {
          setLoading(false);
          setInitialLoad(false);
        }
        return;
      }
      
      const totalCCTVs = allStations.reduce((sum, station) => sum + (station.cctv_count || 0), 0);
      const activeCCTVs = totalCCTVs;
      
      const riskSummary = {
        심각: { count: 0, items: [] as string[] },
        경계: { count: 0, items: [] as string[] },
        주의: { count: 0, items: [] as string[] },
        관심: { count: 0, items: [] as string[] },
      };
      
      const congestionSummary = {
        보통: { count: 0, items: [] as string[] },
        주의: { count: 0, items: [] as string[] },
        혼잡: { count: 0, items: [] as string[] },
        심각: { count: 0, items: [] as string[] },
      };
      
      // let totalCongestion = 0; // 사용하지 않음
      // let congestionCount = 0; // 사용하지 않음
      
      allStations.forEach((station) => {
        const key = station.region_id || 'unknown';
        
        // 위험도 분류 - 구역별 위험도 분포(risk_distribution) 사용
        // 백엔드에서 각 구역의 CCTV별 위험도를 집계해서 전달함
        if (station.risk_distribution) {
          // 구역별 위험도 분포를 사용하여 각 레벨별 개수 집계
          riskSummary.심각.count += station.risk_distribution.심각 || 0;
          riskSummary.경계.count += station.risk_distribution.경계 || 0;
          riskSummary.주의.count += station.risk_distribution.주의 || 0;
          riskSummary.관심.count += station.risk_distribution.관심 || 0;
          
          // 위험도가 있는 구역만 items에 추가
          if (station.risk_distribution.심각 > 0) {
            riskSummary.심각.items.push(key);
          }
          if (station.risk_distribution.경계 > 0) {
            riskSummary.경계.items.push(key);
          }
          if (station.risk_distribution.주의 > 0) {
            riskSummary.주의.items.push(key);
          }
          if (station.risk_distribution.관심 > 0) {
            riskSummary.관심.items.push(key);
          }
        }
        
        // 혼잡도 분류 - 구역별 혼잡도 분포(congestion_distribution) 사용
        // 백엔드에서 각 구역의 CCTV별 congestion_level_molit를 집계해서 전달함
        if (station.congestion_distribution) {
          // 구역별 혼잡도 분포를 사용하여 각 레벨별 개수 집계
          congestionSummary.보통.count += station.congestion_distribution.보통 || 0;
          congestionSummary.주의.count += station.congestion_distribution.주의 || 0;
          congestionSummary.혼잡.count += station.congestion_distribution.혼잡 || 0;
          congestionSummary.심각.count += station.congestion_distribution.심각 || 0;
          
          // 혼잡도가 있는 구역만 items에 추가
          if (station.congestion_distribution.보통 > 0) {
            congestionSummary.보통.items.push(key);
          }
          if (station.congestion_distribution.주의 > 0) {
            congestionSummary.주의.items.push(key);
          }
          if (station.congestion_distribution.혼잡 > 0) {
            congestionSummary.혼잡.items.push(key);
          }
          if (station.congestion_distribution.심각 > 0) {
            congestionSummary.심각.items.push(key);
          }
        }
      });
      
      setOverviewStats({
        totalCCTVs,
        activeCCTVs,
        riskSummary,
        congestionSummary,
        avgCongestionRatio: 0,  // 더 이상 사용하지 않음
      });
      
      // 기존 구역 구조를 유지하면서 데이터만 업데이트
      setRegions((prevRegions) => {
        const regionMap = new Map<string, RegionSummary>();
        
        // 기존 구역 구조를 맵에 저장
        prevRegions.forEach((region) => {
          regionMap.set(region.region_id, { ...region });
        });
        
        // 새로운 데이터로 업데이트
        allStations.forEach((station) => {
          if (!station.region_summary_id) return;
          
          const regionId = station.region_id || String(station.region_summary_id);
          
          if (regionMap.has(regionId)) {
            const region = regionMap.get(regionId)!;
            region.cctv_count = station.cctv_count || 0;
            region.avg_congestion_ratio = 0;  // 더 이상 사용하지 않음
            
            // risk_distribution에서 가장 높은 위험도를 risk_level로 설정
            if (station.risk_distribution) {
              const dist = station.risk_distribution;
              if (dist.심각 > 0) {
                region.risk_level = '심각';
              } else if (dist.경계 > 0) {
                region.risk_level = '경계';
              } else if (dist.주의 > 0) {
                region.risk_level = '주의';
              } else {
                region.risk_level = '관심';
              }
              
              region.risk_distribution = station.risk_distribution;
            } else {
              region.risk_level = '관심';
              region.risk_distribution = {
                심각: 0,
                경계: 0,
                주의: 0,
                관심: 0,
              };
            }
          }
        });
        
        // 기존 순서 유지하면서 반환
        return prevRegions.map((region) => regionMap.get(region.region_id) || region);
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 에러 발생 시 임의 값 생성
      if (initialLoad) {
        // 임의 값 생성 (데모용)
        const dummyTotalCCTVs = 45;
        const dummyActiveCCTVs = 42;
        
        setOverviewStats({
          totalCCTVs: dummyTotalCCTVs,
          activeCCTVs: dummyActiveCCTVs,
          riskSummary: {
            심각: { count: 5, items: ['구역1', '구역2'] },
            경계: { count: 8, items: ['구역3', '구역4'] },
            주의: { count: 12, items: ['구역5', '구역6'] },
            관심: { count: 17, items: ['구역7', '구역8'] },
          },
          congestionSummary: {
            보통: { count: 21, items: ['구역6', '구역7', '구역8'] },
            주의: { count: 15, items: ['구역3', '구역4', '구역5'] },
            혼잡: { count: 4, items: ['구역1'] },
            심각: { count: 2, items: ['구역2'] },
          },
          avgCongestionRatio: 125.5,
        });
        
        // 구역별 임의 값 생성
        setRegions((prevRegions) => {
          return prevRegions.map((region, index) => {
            // 각 구역별로 다른 임의 값 생성
            const baseRatio = 80 + (index * 15) + Math.random() * 30;
            const congestionRatio = Math.min(200, Math.max(50, baseRatio));
            const riskLevels = ['관심', '주의', '경계', '심각'];
            const riskLevel = riskLevels[Math.floor((congestionRatio - 50) / 40)] || '관심';
            const cctvCount = 3 + Math.floor(Math.random() * 8);
            
            return {
              ...region,
              avg_congestion_ratio: Math.round(congestionRatio * 10) / 10,
              cctv_count: cctvCount,
              risk_level: riskLevel,
              risk_distribution: {
                심각: riskLevel === '심각' ? cctvCount : 0,
                경계: riskLevel === '경계' ? cctvCount : 0,
                주의: riskLevel === '주의' ? cctvCount : 0,
                관심: riskLevel === '관심' ? cctvCount : 0,
              },
            };
          });
        });
      }
    } finally {
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false); // 초기 로딩 완료
      }
    }
  }, [initialLoad, regionsInitialized]);

  // 주기적으로 위험도 평균 업데이트 (15초마다)
  useEffect(() => {
    if (!regionsInitialized || regionsRef.current.length === 0) {
      return;
    }
    
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    // 위험도 평균 조회 함수 (ref를 통해 최신 regions 참조)
    const fetchRisk = async () => {
      if (!isMounted || regionsRef.current.length === 0) return;
      await fetchRegionsRiskAverage(regionsRef.current);
    };
    
    // 초기 로드 후 위험도 평균 조회
    fetchRisk();
    
    // 주기적으로 위험도 평균 업데이트 (15초마다)
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchRisk();
      }
    }, 15000);
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [regionsInitialized, fetchRegionsRiskAverage]); // regionsInitialized만 의존성으로 사용하여 불필요한 재실행 방지

  return {
    overviewStats,
    regions,
    loading,
    lastUpdated,
    fetchRegions,
    fetchDashboardData,
    fetchRegionsRiskAverage,
  };
}

