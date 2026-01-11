import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, Table, DatePicker, Select, Button, Space, Tabs } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { api } from '../../lib/api';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

interface ChartData {
  time: string;
  traffic: {
    전체: number;
    [region_name: string]: number;
  };
  congestion_ratio: {
    전체: number;
    [region_name: string]: number;
  };
  congestion_ratio_molit: {
    전체: number;
    [region_name: string]: number;
  };
  congestion_level?: {
    하: number;
    중: number;
    상: number;
  };
  risk_level?: {
    관심: number;
    주의: number;
    경계: number;
    심각: number;
  };
  congestion_level_molit_dist?: {
    보통: number;
    주의: number;
    혼잡: number;
    심각: number;
  };
}

interface TableData {
  key: string;
  time: string;
  region_name: string;
  cctv_name: string;
  congestion_ratio: number;
  congestion_ratio_max?: number;
  congestion_ratio_min?: number;
  congestion_ratio_molit?: number;
  congestion_ratio_molit_max?: number;
  congestion_ratio_molit_min?: number;
  risk_level: string;
  traffic_in_avg: number;
  traffic_in_max: number;
  traffic_in_sum: number;
  traffic_out_avg: number;
  traffic_out_max: number;
  traffic_out_sum: number;
  traffic_avg: number;
  traffic_max: number;
  traffic_sum: number;
  risk_level_1?: number;
  risk_level_2?: number;
  risk_level_3?: number;
  risk_level_4?: number;
  congestion_level_1?: number;
  congestion_level_2?: number;
  congestion_level_3?: number;
  congestion_level_molit_1?: number;
  congestion_level_molit_2?: number;
  congestion_level_molit_3?: number;
  congestion_level_molit_4?: number;
  data_count?: number;
}

export default function DailyStatistics() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [chartTypeTab, setChartTypeTab] = useState<string>('traffic'); // 차트 타입 탭 (traffic, congestion_ratio, congestion_ratio_molit, congestion_level, risk_level, congestion_level_molit_dist)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCCTV, setSelectedCCTV] = useState<string>('all');
  const [regions, setRegions] = useState<Array<{ region_id: string; region_name: string }>>([]);
  const [allCCTVs, setAllCCTVs] = useState<Array<{ cctv_uid: number; cctv_id: string; cctv_name: string; region_id: string }>>([]);
  const [cctvs, setCCTVs] = useState<Array<{ cctv_uid: number; cctv_id: string; cctv_name: string }>>([]);

  // 구역 및 CCTV 목록 가져오기
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const regionsRes = await api.get<{ regions: Array<{ uid: number; region_id: string; region_name: string }> }>('/report/setting/getRegions');
        setRegions(regionsRes.regions.map(r => ({
          region_id: r.region_id,
          region_name: r.region_name,
        })));

        // CCTV 목록 가져오기 (region_id 포함)
        const cctvRes = await api.get<{ status: string; data: Array<{ cctv_uid: number; cctv_id: string; cctv_kr_name: string; region_id: string }> }>('/report/setting/cctvs');
        const cctvList = cctvRes.data.map(c => ({
          cctv_uid: c.cctv_uid,
          cctv_id: c.cctv_id,
          cctv_name: c.cctv_kr_name || c.cctv_id,
          region_id: c.region_id || '',
        }));
        setAllCCTVs(cctvList);
        // 초기에는 CCTV 목록 비우기 (구역 선택 전)
        setCCTVs([]);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

  // 구역 선택 시 해당 구역의 CCTV 목록 필터링
  useEffect(() => {
    if (selectedRegion === 'all') {
      // 구역이 "전체"일 때는 CCTV 목록 비우기
      setCCTVs([]);
      setSelectedCCTV('all');
    } else {
      // 선택된 구역의 CCTV만 필터링
      const filteredCCTVs = allCCTVs.filter(cctv => cctv.region_id === selectedRegion);
      setCCTVs(filteredCCTVs);
      // CCTV 선택을 "전체"로 리셋
      setSelectedCCTV('all');
    }
  }, [selectedRegion, allCCTVs]);

  // 데이터 가져오기 (5분 집계 테이블 기반)
  const fetchData = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // 실제 API 엔드포인트 호출
      const params: any = {
        start_date: startDate,
        end_date: endDate,
      };
      
      if (selectedRegion !== 'all') {
        params.region_id = selectedRegion;
      }
      
      if (selectedCCTV !== 'all') {
        // selectedCCTV는 cctv_uid (number)를 문자열로 저장한 값
        const cctvUid = parseInt(selectedCCTV, 10);
        if (!isNaN(cctvUid)) {
          params.cctv_uid = cctvUid;
        }
      }
      
      const response = await api.get<{
        chart_data: ChartData[];
        table_data: Array<{
          time: string;
          region_name: string;
          cctv_name: string;
          congestion_ratio: number;
          risk_level: string;
          traffic_in_avg: number;
          traffic_in_max: number;
          traffic_in_sum: number;
          traffic_out_avg: number;
          traffic_out_max: number;
          traffic_out_sum: number;
          traffic_avg: number;
          traffic_max: number;
          traffic_sum: number;
        }>;
      }>('/report/getDailyStatistics', { params });
      
      // 차트 데이터 설정
      const chartDataWithKeys = response.chart_data.map((item, index) => ({
        ...item,
        key: `chart-${index}`,
      }));
      
      // 테이블 데이터에서 분포 데이터 집계하여 차트 데이터에 추가
      const timeGroupedData: { [time: string]: any } = {};
      response.table_data.forEach(row => {
        const time = row.time;
        if (!timeGroupedData[time]) {
          timeGroupedData[time] = {
            congestion_level: { 하: 0, 중: 0, 상: 0, total: 0 },
            risk_level: { 관심: 0, 주의: 0, 경계: 0, 심각: 0, total: 0 },
            congestion_level_molit_dist: { 보통: 0, 주의: 0, 혼잡: 0, 심각: 0, total: 0 },
          };
        }
        
        // 혼잡도 분포 집계
        timeGroupedData[time].congestion_level.하 += row.congestion_level_1 || 0;
        timeGroupedData[time].congestion_level.중 += row.congestion_level_2 || 0;
        timeGroupedData[time].congestion_level.상 += row.congestion_level_3 || 0;
        timeGroupedData[time].congestion_level.total += (row.congestion_level_1 || 0) + (row.congestion_level_2 || 0) + (row.congestion_level_3 || 0);
        
        // 혼잡지속도 분포 집계
        timeGroupedData[time].risk_level.관심 += row.risk_level_1 || 0;
        timeGroupedData[time].risk_level.주의 += row.risk_level_2 || 0;
        timeGroupedData[time].risk_level.경계 += row.risk_level_3 || 0;
        timeGroupedData[time].risk_level.심각 += row.risk_level_4 || 0;
        timeGroupedData[time].risk_level.total += (row.risk_level_1 || 0) + (row.risk_level_2 || 0) + (row.risk_level_3 || 0) + (row.risk_level_4 || 0);
        
        // 혼잡도(국토부) 분포 집계
        timeGroupedData[time].congestion_level_molit_dist.보통 += row.congestion_level_molit_1 || 0;
        timeGroupedData[time].congestion_level_molit_dist.주의 += row.congestion_level_molit_2 || 0;
        timeGroupedData[time].congestion_level_molit_dist.혼잡 += row.congestion_level_molit_3 || 0;
        timeGroupedData[time].congestion_level_molit_dist.심각 += row.congestion_level_molit_4 || 0;
        timeGroupedData[time].congestion_level_molit_dist.total += (row.congestion_level_molit_1 || 0) + (row.congestion_level_molit_2 || 0) + (row.congestion_level_molit_3 || 0) + (row.congestion_level_molit_4 || 0);
      });
      
      // 차트 데이터에 분포 데이터 추가
      chartDataWithKeys.forEach(item => {
        const time = item.time;
        if (timeGroupedData[time]) {
          const data = timeGroupedData[time];
          
          // 비율 계산
          item.congestion_level = {
            하: data.congestion_level.total > 0 ? (data.congestion_level.하 / data.congestion_level.total) * 100 : 0,
            중: data.congestion_level.total > 0 ? (data.congestion_level.중 / data.congestion_level.total) * 100 : 0,
            상: data.congestion_level.total > 0 ? (data.congestion_level.상 / data.congestion_level.total) * 100 : 0,
          };
          
          item.risk_level = {
            관심: data.risk_level.total > 0 ? (data.risk_level.관심 / data.risk_level.total) * 100 : 0,
            주의: data.risk_level.total > 0 ? (data.risk_level.주의 / data.risk_level.total) * 100 : 0,
            경계: data.risk_level.total > 0 ? (data.risk_level.경계 / data.risk_level.total) * 100 : 0,
            심각: data.risk_level.total > 0 ? (data.risk_level.심각 / data.risk_level.total) * 100 : 0,
          };
          
          item.congestion_level_molit_dist = {
            보통: data.congestion_level_molit_dist.total > 0 ? (data.congestion_level_molit_dist.보통 / data.congestion_level_molit_dist.total) * 100 : 0,
            주의: data.congestion_level_molit_dist.total > 0 ? (data.congestion_level_molit_dist.주의 / data.congestion_level_molit_dist.total) * 100 : 0,
            혼잡: data.congestion_level_molit_dist.total > 0 ? (data.congestion_level_molit_dist.혼잡 / data.congestion_level_molit_dist.total) * 100 : 0,
            심각: data.congestion_level_molit_dist.total > 0 ? (data.congestion_level_molit_dist.심각 / data.congestion_level_molit_dist.total) * 100 : 0,
          };
        } else {
          // 데이터가 없는 경우 0으로 초기화
          item.congestion_level = { 하: 0, 중: 0, 상: 0 };
          item.risk_level = { 관심: 0, 주의: 0, 경계: 0, 심각: 0 };
          item.congestion_level_molit_dist = { 보통: 0, 주의: 0, 혼잡: 0, 심각: 0 };
        }
      });
      
      setChartData(chartDataWithKeys);
      
      // 테이블 데이터 설정 (key 추가)
      const tableDataWithKeys = response.table_data.map((item, index) => ({
        ...item,
        key: `table-${index}`,
      }));
      setTableData(tableDataWithKeys);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // 에러 발생 시 빈 데이터 설정
      setChartData([]);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedRegion, selectedCCTV, regions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart.js 옵션 생성 함수
  const getChartOptions = (type: string) => {
    const isTraffic = type === 'traffic';
    const isDistribution = ['congestion_level', 'risk_level', 'congestion_level_molit_dist'].includes(type);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              if (isTraffic) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}명`;
              } else if (isDistribution) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
              } else {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: isDistribution ? 100 : undefined,
          title: {
            display: true,
            text: isTraffic ? 'Traffic (명)' : isDistribution ? '비율 (%)' : '혼잡도 (%)'
          },
          stacked: isDistribution,
        },
        x: {
          title: {
            display: true,
            text: '일자'
          },
          stacked: isDistribution,
        }
      }
    };
  };

  // Chart.js 데이터 생성
  const getChartData = (type: string) => {
    if (chartData.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // 날짜 라벨 추출
    const labels = chartData.map(d => {
      const timeStr = d.time as string;
      // "YYYY-MM-DD" 형식에서 날짜만 추출
      return timeStr.split(' ')[0] || timeStr;
    });
    
    const datasets: any[] = [];
    const isTraffic = type === 'traffic';
    const isDistribution = ['congestion_level', 'risk_level', 'congestion_level_molit_dist'].includes(type);
    
    // 분포 차트인 경우
    if (isDistribution) {
      const distributionData = chartData.map(d => d[type as keyof ChartData] as any);
      
      if (type === 'congestion_level') {
        // 혼잡도 분포: 하, 중, 상
        datasets.push({
          type: 'bar' as const,
          label: '하',
          data: distributionData.map(d => d?.하 || 0),
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '중',
          data: distributionData.map(d => d?.중 || 0),
          backgroundColor: '#faad14',
          borderColor: '#faad14',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '상',
          data: distributionData.map(d => d?.상 || 0),
          backgroundColor: '#f5222d',
          borderColor: '#f5222d',
          borderWidth: 1,
          yAxisID: 'y',
        });
      } else if (type === 'risk_level') {
        // 혼잡지속도 분포: 관심, 주의, 경계, 심각
        datasets.push({
          type: 'bar' as const,
          label: '관심',
          data: distributionData.map(d => d?.관심 || 0),
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '주의',
          data: distributionData.map(d => d?.주의 || 0),
          backgroundColor: '#faad14',
          borderColor: '#faad14',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '경계',
          data: distributionData.map(d => d?.경계 || 0),
          backgroundColor: '#fa8c16',
          borderColor: '#fa8c16',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '심각',
          data: distributionData.map(d => d?.심각 || 0),
          backgroundColor: '#f5222d',
          borderColor: '#f5222d',
          borderWidth: 1,
          yAxisID: 'y',
        });
      } else if (type === 'congestion_level_molit_dist') {
        // 혼잡도(국토부) 분포: 보통, 주의, 혼잡, 심각
        datasets.push({
          type: 'bar' as const,
          label: '보통',
          data: distributionData.map(d => d?.보통 || 0),
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '주의',
          data: distributionData.map(d => d?.주의 || 0),
          backgroundColor: '#faad14',
          borderColor: '#faad14',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '혼잡',
          data: distributionData.map(d => d?.혼잡 || 0),
          backgroundColor: '#fa8c16',
          borderColor: '#fa8c16',
          borderWidth: 1,
          yAxisID: 'y',
        });
        datasets.push({
          type: 'bar' as const,
          label: '심각',
          data: distributionData.map(d => d?.심각 || 0),
          backgroundColor: '#f5222d',
          borderColor: '#f5222d',
          borderWidth: 1,
          yAxisID: 'y',
        });
      }
    } else {
      // 기존 차트 (Traffic, 혼잡비율, 혼잡비율(국토부))
      const metricData = chartData.map(d => d[type as keyof ChartData] as any);
      const isRatio = type === 'congestion_ratio' || type === 'congestion_ratio_molit';
      
      // CCTV 선택 시 테이블 데이터에서 CCTV별 데이터 집계
      if (selectedCCTV !== 'all') {
        const selectedCCTVData = cctvs.find(c => String(c.cctv_uid) === selectedCCTV);
        if (selectedCCTVData) {
          // 테이블 데이터에서 해당 CCTV의 데이터만 필터링하여 날짜별 집계
          const cctvTableData = tableData.filter(row => row.cctv_name === selectedCCTVData.cctv_name);
          const timeGrouped: { [time: string]: any } = {};
          
          cctvTableData.forEach(row => {
            const time = row.time;
            if (!timeGrouped[time]) {
              timeGrouped[time] = {
                traffic_sum: 0,
                traffic_avg: 0,
                traffic_max: 0,
                congestion_ratio: 0,
                congestion_ratio_molit: 0,
                count: 0,
              };
            }
            
            if (type === 'traffic') {
              timeGrouped[time].traffic_sum += row.traffic_sum || 0;
              timeGrouped[time].traffic_avg += row.traffic_avg || 0;
              timeGrouped[time].traffic_max = Math.max(timeGrouped[time].traffic_max, row.traffic_max || 0);
            } else if (type === 'congestion_ratio') {
              timeGrouped[time].congestion_ratio += row.congestion_ratio || 0;
            } else if (type === 'congestion_ratio_molit') {
              timeGrouped[time].congestion_ratio_molit += row.congestion_ratio_molit || 0;
            }
            timeGrouped[time].count += 1;
          });
          
          // 차트 데이터 생성
          const cctvChartData = labels.map(label => {
            const chartItem = chartData.find(d => {
              const timeStr = d.time as string;
              const date = timeStr.split(' ')[0] || timeStr;
              return date === label;
            });
            
            if (chartItem) {
              const time = chartItem.time;
              const grouped = timeGrouped[time];
              if (grouped && grouped.count > 0) {
                if (type === 'traffic') {
                  return grouped.traffic_sum;
                } else if (type === 'congestion_ratio') {
                  return grouped.congestion_ratio / grouped.count;
                } else if (type === 'congestion_ratio_molit') {
                  return grouped.congestion_ratio_molit / grouped.count;
                }
              }
            }
            return 0;
          });
          
          datasets.push({
            type: isRatio ? 'line' as const : 'bar' as const,
            label: selectedCCTVData.cctv_name,
            data: cctvChartData,
            backgroundColor: isRatio ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.6)',
            borderColor: '#1890ff',
            borderWidth: isRatio ? 2 : 1,
            tension: isRatio ? 0.1 : undefined,
            fill: isRatio ? false : undefined,
            pointRadius: isRatio ? 3 : undefined,
            pointHoverRadius: isRatio ? 5 : undefined,
            yAxisID: 'y',
          });
        }
      } else if (selectedRegion === 'all') {
        // 전체 선택 시: 전체 데이터만 표시
        datasets.push({
          type: isRatio ? 'line' as const : 'bar' as const,
          label: `전체 ${isTraffic ? 'Traffic' : '혼잡도'}`,
          data: metricData.map(d => d?.전체 || 0),
          backgroundColor: isRatio ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.6)',
          borderColor: '#1890ff',
          borderWidth: isRatio ? 2 : 1,
          tension: isRatio ? 0.1 : undefined,
          fill: isRatio ? false : undefined,
          pointRadius: isRatio ? 3 : undefined,
          pointHoverRadius: isRatio ? 5 : undefined,
          yAxisID: 'y',
        });
      } else {
        // 특정 구역 선택 시: 해당 구역 데이터만 표시
        const selectedRegionData = regions.find(r => r.region_id === selectedRegion);
        if (selectedRegionData && metricData.some(d => d?.[selectedRegionData.region_name] !== undefined)) {
          datasets.push({
            type: isRatio ? 'line' as const : 'bar' as const,
            label: selectedRegionData.region_name,
            data: metricData.map(d => d?.[selectedRegionData.region_name] || 0),
            backgroundColor: isRatio ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.6)',
            borderColor: '#1890ff',
            borderWidth: isRatio ? 2 : 1,
            tension: isRatio ? 0.1 : undefined,
            fill: isRatio ? false : undefined,
            pointRadius: isRatio ? 3 : undefined,
            pointHoverRadius: isRatio ? 5 : undefined,
            yAxisID: 'y',
          });
        }
      }
    }
    
    return { labels, datasets };
  };

  // CSV 다운로드
  const handleExportCSV = () => {
    // 선택된 필터 조건에 따라 테이블 데이터 필터링
    let filteredData = tableData;
    
    if (selectedCCTV !== 'all') {
      // CCTV 선택 시: 해당 CCTV 데이터만 표시
      const selectedCCTVData = cctvs.find(c => String(c.cctv_uid) === selectedCCTV);
      if (selectedCCTVData) {
        filteredData = filteredData.filter(row => row.cctv_name === selectedCCTVData.cctv_name);
      }
    } else if (selectedRegion !== 'all') {
      // 구역 선택 시: 해당 구역 데이터만 표시
      const selectedRegionData = regions.find(r => r.region_id === selectedRegion);
      if (selectedRegionData) {
        filteredData = filteredData.filter(row => row.region_name === selectedRegionData.region_name);
      }
    } else {
      // 전체 선택 시: "전체" 행만 표시
      filteredData = filteredData.filter(row => row.region_name === '전체');
    }
    
    const headers = [
      '일자', '구역명', 'CCTV',
      'Traffic 합계', 'Traffic 평균', 'Traffic 최대',
      '혼잡도-하', '혼잡도-중', '혼잡도-상',
      '혼잡지속도-관심', '혼잡지속도-주의', '혼잡지속도-경계', '혼잡지속도-심각',
      '혼잡도(국토부)-보통', '혼잡도(국토부)-주의', '혼잡도(국토부)-혼잡', '혼잡도(국토부)-심각',
      '데이터 개수',
      'In 평균', 'In 최대', 'In 합계',
      'Out 평균', 'Out 최대', 'Out 합계'
    ];
    const rows = filteredData.map(row => [
      row.time,
      row.region_name,
      row.cctv_name,
      row.traffic_sum || 0,
      row.traffic_avg || 0,
      row.traffic_max || 0,
      row.congestion_level_1 || 0,
      row.congestion_level_2 || 0,
      row.congestion_level_3 || 0,
      row.risk_level_1 || 0,
      row.risk_level_2 || 0,
      row.risk_level_3 || 0,
      row.risk_level_4 || 0,
      row.congestion_level_molit_1 || 0,
      row.congestion_level_molit_2 || 0,
      row.congestion_level_molit_3 || 0,
      row.congestion_level_molit_4 || 0,
      row.data_count || 0,
      row.traffic_in_avg || 0,
      row.traffic_in_max || 0,
      row.traffic_in_sum || 0,
      row.traffic_out_avg || 0,
      row.traffic_out_max || 0,
      row.traffic_out_sum || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `일별_혼잡_현황_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>일자</div>,
      dataIndex: 'time',
      key: 'time',
      width: 160,
      fixed: 'left' as const,
      align: 'center',
    },
    {
      title: <div style={{ textAlign: 'center' }}>구역명</div>,
      dataIndex: 'region_name',
      key: 'region_name',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: <div style={{ textAlign: 'center' }}>CCTV</div>,
      dataIndex: 'cctv_name',
      key: 'cctv_name',
      width: 100,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Traffic</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_sum',
          key: 'traffic_sum',
          width: 120,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>평균</div>,
          dataIndex: 'traffic_avg',
          key: 'traffic_avg',
          width: 120,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_max',
          key: 'traffic_max',
          width: 120,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡도</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>하</div>,
          dataIndex: 'congestion_level_1',
          key: 'congestion_level_1',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>중</div>,
          dataIndex: 'congestion_level_2',
          key: 'congestion_level_2',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>상</div>,
          dataIndex: 'congestion_level_3',
          key: 'congestion_level_3',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡지속도</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>관심</div>,
          dataIndex: 'risk_level_1',
          key: 'risk_level_1',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'risk_level_2',
          key: 'risk_level_2',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>경계</div>,
          dataIndex: 'risk_level_3',
          key: 'risk_level_3',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'risk_level_4',
          key: 'risk_level_4',
          width: 100,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡도(국토부)</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>보통</div>,
          dataIndex: 'congestion_level_molit_1',
          key: 'congestion_level_molit_1',
          width: 130,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'congestion_level_molit_2',
          key: 'congestion_level_molit_2',
          width: 130,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>혼잡</div>,
          dataIndex: 'congestion_level_molit_3',
          key: 'congestion_level_molit_3',
          width: 130,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'congestion_level_molit_4',
          key: 'congestion_level_molit_4',
          width: 130,
          align: 'right',
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>데이터 개수</div>,
      dataIndex: 'data_count',
      key: 'data_count',
      width: 100,
      align: 'right',
      render: (value: number) => value?.toLocaleString() || '0',
    },
    {
      title: <div style={{ textAlign: 'center' }}>In</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>평균</div>,
          dataIndex: 'traffic_in_avg',
          key: 'traffic_in_avg',
          width: 100,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_in_max',
          key: 'traffic_in_max',
          width: 100,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_in_sum',
          key: 'traffic_in_sum',
          width: 120,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>Out</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>평균</div>,
          dataIndex: 'traffic_out_avg',
          key: 'traffic_out_avg',
          width: 100,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_out_max',
          key: 'traffic_out_max',
          width: 100,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_out_sum',
          key: 'traffic_out_sum',
          width: 120,
          align: 'right',
          render: (value: number) => value?.toLocaleString() || '0',
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>일별 혼잡 현황</Title>
        <Text type="secondary">
          일별 혼잡도 통계
        </Text>
      </div>

      {/* 검색 조건 */}
      <Card variant="borderless" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text strong>검색일자:</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              format="YYYY-MM-DD"
            />
            <Text strong>구역:</Text>
            <Select
              value={selectedRegion}
              onChange={setSelectedRegion}
              style={{ width: 200 }}
            >
              <Select.Option value="all">전체</Select.Option>
              {regions.map(region => (
                <Select.Option key={region.region_id} value={region.region_id}>
                  {region.region_name}
                </Select.Option>
              ))}
            </Select>
            <Text strong>CCTV:</Text>
            <Select
              value={selectedCCTV}
              onChange={setSelectedCCTV}
              style={{ width: 200 }}
              disabled={selectedRegion === 'all'}
              placeholder={selectedRegion === 'all' ? '구역을 먼저 선택하세요' : '전체'}
            >
              <Select.Option value="all">전체</Select.Option>
              {cctvs.map(cctv => (
                <Select.Option key={cctv.cctv_uid} value={String(cctv.cctv_uid)}>
                  {cctv.cctv_name}
                </Select.Option>
              ))}
            </Select>
            <Button type="primary" onClick={fetchData} loading={loading}>
              검색
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 그래프 */}
      <Card 
        variant="borderless" 
        style={{ marginBottom: '24px' }}
      >
        <Tabs
          activeKey={chartTypeTab}
          onChange={setChartTypeTab}
          items={[
            {
              key: 'traffic',
              label: 'Traffic',
            },
            {
              key: 'congestion_ratio',
              label: '혼잡비율',
            },
            {
              key: 'congestion_ratio_molit',
              label: '혼잡비율(국토부)',
            },
            {
              key: 'congestion_level',
              label: '혼잡도',
            },
            {
              key: 'risk_level',
              label: '혼잡지속도',
            },
            {
              key: 'congestion_level_molit_dist',
              label: '혼잡도(국토부)',
            },
          ]}
          style={{ marginBottom: '16px' }}
        />
        {loading ? (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ height: '400px', position: 'relative' }}>
            {chartData.length > 0 ? (
              <Chart type="bar" data={getChartData(chartTypeTab)} options={getChartOptions(chartTypeTab)} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Text type="secondary">데이터가 없습니다.</Text>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 표 */}
      <Card 
        variant="borderless" 
        title={<Title level={4} style={{ margin: 0 }}>상세데이터</Title>}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>* 15초간 데이터의 1일 통계</Text>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
              CSV 다운로드
            </Button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={(() => {
              // 선택된 필터 조건에 따라 테이블 데이터 필터링
              let filteredData = tableData;
              
              if (selectedCCTV !== 'all') {
                // CCTV 선택 시: 해당 CCTV 데이터만 표시
                const selectedCCTVData = cctvs.find(c => String(c.cctv_uid) === selectedCCTV);
                if (selectedCCTVData) {
                  filteredData = filteredData.filter(row => row.cctv_name === selectedCCTVData.cctv_name);
                }
              } else if (selectedRegion !== 'all') {
                // 구역 선택 시: 해당 구역 데이터만 표시
                const selectedRegionData = regions.find(r => r.region_id === selectedRegion);
                if (selectedRegionData) {
                  filteredData = filteredData.filter(row => row.region_name === selectedRegionData.region_name);
                }
              } else {
                // 전체 선택 시: "전체" 행만 표시
                filteredData = filteredData.filter(row => row.region_name === '전체');
              }
              
              return filteredData;
            })()}
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content', y: undefined }}
            variant="bordered"
            size="middle"
          />
        </div>
      </Card>
    </div>
  );
}
