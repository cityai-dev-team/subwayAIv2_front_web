import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, Table, Select, Space, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { api } from '../../lib/api';

const { Title: AntTitle, Text } = Typography;

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface IntervalData {
  time: string;
  region_id: string | null;
  region_name: string;
  traffic_sum: number;
  traffic_avg: number;
  traffic_max: number;
  risk_level_distribution: {
    관심: number;
    주의: number;
    경계: number;
    심각: number;
  };
  congestion_level_distribution: {
    하: number;
    중: number;
    상: number;
  };
  congestion_level_molit_distribution: {
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
  traffic_sum: number;
  traffic_avg: number;
  traffic_max: number;
  // 위험도 개별 컬럼
  risk_관심: number;
  risk_주의: number;
  risk_경계: number;
  risk_심각: number;
  // 혼잡도 개별 컬럼 (상중하)
  congestion_하: number;
  congestion_중: number;
  congestion_상: number;
  // 혼잡도 개별 컬럼 (국토부 기준)
  congestion_보통: number;
  congestion_주의: number;
  congestion_혼잡: number;
  congestion_심각: number;
}

export default function TimeTrendMonitoring() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<Array<{ time: string; [key: string]: string | number }>>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [regions, setRegions] = useState<Array<{ region_id: string; region_name: string }>>([]);
  const [regionNames, setRegionNames] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 구역 목록 가져오기
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await api.get<{ regions: Array<{ uid: number; region_id: string; region_name: string }> }>('/report/setting/getRegions');
        const regionList = res.regions.map(r => ({
          region_id: r.region_id,
          region_name: r.region_name,
        }));
        setRegions(regionList);
        setRegionNames(regionList.map(r => r.region_name));
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      }
    };
    fetchRegions();
  }, []);

  // 최근 1시간 1분 단위 데이터 가져오기
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const regionId = selectedRegion === 'all' ? undefined : selectedRegion;
      const response = await api.get<{ intervals: IntervalData[] }>('/report/getHourly5MinTrend', {
        params: regionId ? { region_id: regionId } : {}
      });
      
      const intervals = response.intervals || [];
      
      // 그래프 데이터: 전체 선택 시 전체만 표시
      // 차트는 왼쪽에서 오른쪽으로 시간이 흐르도록 오름차순 정렬
      if (selectedRegion === 'all') {
        // '전체' 데이터만 필터링
        const overallData = intervals.filter(interval => interval.region_name === '전체');
        
        // 시간 기준 오름차순 정렬 (오래된 데이터가 앞에, 차트는 왼쪽에서 오른쪽으로)
        overallData.sort((a, b) => {
          const timeA = a.time.includes(' ') ? a.time.split(' ')[1] : a.time;
          const timeB = b.time.includes(' ') ? b.time.split(' ')[1] : b.time;
          const partsA = timeA.split(':').map(Number);
          const partsB = timeB.split(':').map(Number);
          const totalA = partsA[0] * 3600 + partsA[1] * 60 + (partsA[2] || 0);
          const totalB = partsB[0] * 3600 + partsB[1] * 60 + (partsB[2] || 0);
          return totalA - totalB; // 오름차순
        });
        
        // 차트 데이터 포맷팅
        const chartDataFormatted = overallData.map(interval => ({
          time: interval.time,
          '전체': interval.traffic_sum
        }));
        
        setChartData(chartDataFormatted);
      } else {
        // 특정 구역 선택 시
        const regionData = intervals.filter(interval => interval.region_id === selectedRegion);
        
        // 시간 기준 오름차순 정렬 (오래된 데이터가 앞에, 차트는 왼쪽에서 오른쪽으로)
        regionData.sort((a, b) => {
          const timeA = a.time.includes(' ') ? a.time.split(' ')[1] : a.time;
          const timeB = b.time.includes(' ') ? b.time.split(' ')[1] : b.time;
          const partsA = timeA.split(':').map(Number);
          const partsB = timeB.split(':').map(Number);
          const totalA = partsA[0] * 3600 + partsA[1] * 60 + (partsA[2] || 0);
          const totalB = partsB[0] * 3600 + partsB[1] * 60 + (partsB[2] || 0);
          return totalA - totalB; // 오름차순
        });
        
        const chartDataFormatted = regionData.map(interval => ({
          time: interval.time,
          [interval.region_name]: interval.traffic_sum
        }));
        setChartData(chartDataFormatted);
      }
      
      // 표 데이터: 전체 선택 시 전체만, 특정 구역 선택 시 해당 구역만 표시
      let filteredIntervals = intervals;
      if (selectedRegion === 'all') {
        // 전체 선택 시 '전체' 데이터만 필터링
        filteredIntervals = intervals.filter(interval => interval.region_name === '전체');
      } else {
        // 특정 구역 선택 시 해당 구역 데이터만 필터링
        filteredIntervals = intervals.filter(interval => interval.region_id === selectedRegion);
      }
      
      // 시간 기준 내림차순 정렬 (최신 데이터가 앞에) - 원본 시간 문자열로 정렬
      filteredIntervals.sort((a, b) => {
        const timeA = a.time.includes(' ') ? a.time.split(' ')[1] : a.time;
        const timeB = b.time.includes(' ') ? b.time.split(' ')[1] : b.time;
        const partsA = timeA.split(':').map(Number);
        const partsB = timeB.split(':').map(Number);
        const totalA = partsA[0] * 3600 + partsA[1] * 60 + (partsA[2] || 0);
        const totalB = partsB[0] * 3600 + partsB[1] * 60 + (partsB[2] || 0);
        return totalB - totalA; // 내림차순
      });
      
      const tableDataFormatted: TableData[] = filteredIntervals.map((interval, index) => {
        // 시간만 추출 (날짜 제거, 초 제거)
        const timeStr = interval.time;
        const displayTime = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
        // HH:MM:SS → HH:MM 형식으로 변환
        const timeWithoutSeconds = displayTime.split(':').slice(0, 2).join(':');
        
        return {
          key: `interval-${index}-${interval.region_id || 'all'}`,
          time: timeWithoutSeconds,
          region_name: interval.region_name,
          traffic_sum: interval.traffic_sum,
          traffic_avg: interval.traffic_avg,
          traffic_max: interval.traffic_max,
          // 혼잡지속도 개별 컬럼 (정수로 변환)
          risk_관심: Math.round(interval.risk_level_distribution.관심),
          risk_주의: Math.round(interval.risk_level_distribution.주의),
          risk_경계: Math.round(interval.risk_level_distribution.경계),
          risk_심각: Math.round(interval.risk_level_distribution.심각),
          // 혼잡도 개별 컬럼 (상중하, 정수로 변환)
          congestion_하: Math.round(interval.congestion_level_distribution?.하 || 0),
          congestion_중: Math.round(interval.congestion_level_distribution?.중 || 0),
          congestion_상: Math.round(interval.congestion_level_distribution?.상 || 0),
          // 혼잡도 개별 컬럼 (국토부 기준, 정수로 변환)
          congestion_보통: Math.round(interval.congestion_level_molit_distribution.보통),
          congestion_주의: Math.round(interval.congestion_level_molit_distribution.주의),
          congestion_혼잡: Math.round(interval.congestion_level_molit_distribution.혼잡),
          congestion_심각: Math.round(interval.congestion_level_molit_distribution.심각),
        };
      });
      
      setTableData(tableDataFormatted);
      setLastUpdated(new Date()); // 마지막 업데이트 시간 저장
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setChartData([]);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, regionNames]);

  // 초기 데이터 로드 및 주기적 업데이트 (1분마다)
  useEffect(() => {
    if (regions.length > 0) {
      fetchData();
      const interval = setInterval(() => {
        fetchData();
      }, 60000); // 1분마다 업데이트
      return () => clearInterval(interval);
    }
  }, [fetchData, regions]);

  // Chart.js 옵션
  const chartOptions = {
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
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}명`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Traffic 합계 (명)'
        },
        stacked: false, // 막대와 라인이 같은 Y축 사용
      },
      x: {
        title: {
          display: true,
          text: '시간'
        },
        stacked: false,
      }
    }
  };

  // Chart.js 데이터 생성
  const getChartData = () => {
    if (chartData.length === 0 || !chartData.some(d => d.time)) {
      return { labels: [], datasets: [] };
    }
    
    // 시간만 추출 (날짜 제거, 초 제거)
    const labels = chartData.map(d => {
      const timeStr = d.time as string;
      // 날짜가 포함되어 있으면 시간만 추출
      let timeOnly = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
      // HH:MM:SS → HH:MM 형식으로 변환
      if (timeOnly.split(':').length === 3) {
        timeOnly = timeOnly.split(':').slice(0, 2).join(':');
      }
      return timeOnly;
    });
    const datasets: any[] = [];
    
    if (selectedRegion === 'all') {
      // 전체 막대만 추가
      if (chartData.some(d => d['전체'] !== undefined)) {
        datasets.push({
          type: 'bar' as const,
          label: '전체',
          data: chartData.map(d => d['전체'] as number || 0),
          backgroundColor: 'rgba(24, 144, 255, 0.6)',
          borderColor: '#1890ff',
          borderWidth: 1,
          yAxisID: 'y',
        });
      }
    } else {
      // 특정 구역 선택 시 막대로 표시
      const selectedRegionName = regions.find(r => r.region_id === selectedRegion)?.region_name || '선택된 구역';
      const regionKey = chartData.length > 0 ? Object.keys(chartData[0]).find(k => k !== 'time') : null;
      if (regionKey) {
        datasets.push({
          type: 'bar' as const,
          label: selectedRegionName,
          data: chartData.map(d => {
            const key = Object.keys(d).find(k => k !== 'time');
            return (d[key as string] as number) || 0;
          }),
          backgroundColor: 'rgba(24, 144, 255, 0.6)',
          borderColor: '#1890ff',
          borderWidth: 1,
          yAxisID: 'y',
        });
      }
    }
    
    // datasets가 비어있으면 빈 데이터 반환
    if (datasets.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    return { labels, datasets };
  };

  // CSV 다운로드 함수
  const handleExportCSV = () => {
    // 시작시간과 종료시간 계산
    if (tableData.length === 0) return;
    
    const times = tableData.map(row => {
      const [h, m] = row.time.split(':').map(Number);
      return h * 3600 + m * 60;
    });
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
    };
    
    const startTime = formatTime(minTime);
    const endTime = formatTime(maxTime);
    
    const headers = [
      '시간', '구역명',
      'Traffic 합계', 'Traffic 평균', 'Traffic 최대',
      '혼잡도-하', '혼잡도-중', '혼잡도-상',
      '혼잡지속도-관심', '혼잡지속도-주의', '혼잡지속도-경계', '혼잡지속도-심각',
      '혼잡도-보통', '혼잡도-주의', '혼잡도-혼잡', '혼잡도-심각'
    ];
    
    const rows = tableData.map(row => [
      row.time,
      row.region_name,
      row.traffic_sum,
      Math.round(row.traffic_avg),
      row.traffic_max,
      Math.round(row.congestion_하),
      Math.round(row.congestion_중),
      Math.round(row.congestion_상),
      Math.round(row.risk_관심),
      Math.round(row.risk_주의),
      Math.round(row.risk_경계),
      Math.round(row.risk_심각),
      Math.round(row.congestion_보통),
      Math.round(row.congestion_주의),
      Math.round(row.congestion_혼잡),
      Math.round(row.congestion_심각),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `시간별_모니터링_${startTime}_${endTime}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>시간</div>,
      dataIndex: 'time',
      key: 'time',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
      sorter: (a: TableData, b: TableData) => {
        // 시간 문자열을 직접 비교 (HH:MM 형식)
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const totalA = timeA[0] * 60 + timeA[1];
        const totalB = timeB[0] * 60 + timeB[1];
        return totalB - totalA; // 내림차순
      },
      sortDirections: ['descend', 'ascend'] as ('descend' | 'ascend')[],
      defaultSortOrder: 'descend' as const,
    },
    {
      title: <div style={{ textAlign: 'center' }}>구역명</div>,
      dataIndex: 'region_name',
      key: 'region_name',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Traffic</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_sum',
          key: 'traffic_sum',
          width: 100,
          align: 'right' as const,
          render: (value: number) => value.toLocaleString(),
        },
        {
          title: <div style={{ textAlign: 'center' }}>평균</div>,
          dataIndex: 'traffic_avg',
          key: 'traffic_avg',
          width: 100,
          align: 'right' as const,
          render: (value: number) => Math.round(value).toLocaleString(),
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_max',
          key: 'traffic_max',
          width: 100,
          align: 'right' as const,
          render: (value: number) => value.toLocaleString(),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡도</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>하</div>,
          dataIndex: 'congestion_하',
          key: 'congestion_하',
          width: 80,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>중</div>,
          dataIndex: 'congestion_중',
          key: 'congestion_중',
          width: 80,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>상</div>,
          dataIndex: 'congestion_상',
          key: 'congestion_상',
          width: 80,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value.toLocaleString()}</span>
          ),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡지속도</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>관심</div>,
          dataIndex: 'risk_관심',
          key: 'risk_관심',
          width: 90,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'risk_주의',
          key: 'risk_주의',
          width: 90,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>경계</div>,
          dataIndex: 'risk_경계',
          key: 'risk_경계',
          width: 90,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'risk_심각',
          key: 'risk_심각',
          width: 90,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value.toLocaleString()}</span>
          ),
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center' }}>혼잡도(국토부)</div>,
      children: [
        {
          title: <div style={{ textAlign: 'center' }}>보통</div>,
          dataIndex: 'congestion_보통',
          key: 'congestion_보통',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'congestion_주의',
          key: 'congestion_주의',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>혼잡</div>,
          dataIndex: 'congestion_혼잡',
          key: 'congestion_혼잡',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value.toLocaleString()}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'congestion_심각',
          key: 'congestion_심각',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#f5222d' }}>{value.toLocaleString()}</span>
          ),
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <AntTitle level={2} style={{ margin: 0 }}>시간별 모니터링</AntTitle>
          </div>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
              마지막 업데이트: {lastUpdated.toLocaleString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </Text>
          )}
        </div>
      </div>

      {/* 검색 조건 - 구역만 선택 */}
      <Card variant="borderless" style={{ marginBottom: '24px' }}>
        <Space wrap style={{ width: '100%' }}>
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
          <Text type="secondary" style={{ marginLeft: '16px' }}>
            현재 시간 기준 최근 1시간 데이터 (1분 단위)
          </Text>
        </Space>
      </Card>

      {/* 그래프 - Traffic 합계 (Chart.js) */}
      <Card 
        variant="borderless" 
        title={<AntTitle level={4} style={{ margin: 0 }}>Traffic 합계 추이</AntTitle>}
        style={{ marginBottom: '24px' }}
      >
        {loading ? (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (() => {
          const chartDataResult = getChartData();
          if (chartDataResult.datasets.length === 0 || chartDataResult.labels.length === 0) {
            return (
              <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">데이터가 없습니다.</Text>
              </div>
            );
          }
          return (
            <div style={{ height: '400px' }}>
              <Chart type="bar" data={chartDataResult} options={chartOptions} />
            </div>
          );
        })()}
      </Card>

      {/* 표 */}
      <Card 
        variant="borderless" 
        title={<AntTitle level={4} style={{ margin: 0 }}>상세 데이터</AntTitle>}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px', margin: 0 }}>
              * 15초간 데이터의 1분 합계
            </Text>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
              CSV 다운로드
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1500, y: 600 }}
          sticky={{ offsetHeader: 0 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
