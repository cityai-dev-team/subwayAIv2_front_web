import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Table, DatePicker, Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FiveMinData {
  key: string;
  period_start: string;
  period_end: string;
  region_name: string;
  cctv_id: string;
  cctv_name: string;
  traffic_in_sum: number;
  traffic_in_avg: number;
  traffic_in_max: number;
  traffic_out_sum: number;
  traffic_out_avg: number;
  traffic_out_max: number;
  traffic_sum: number;
  traffic_avg: number;
  traffic_max: number;
  congestion_ratio_avg: number;
  congestion_ratio_max: number;
  congestion_ratio_min: number;
  congestion_ratio_molit_avg: number;
  congestion_ratio_molit_max: number;
  congestion_ratio_molit_min: number;
  risk_level_1: number;
  risk_level_2: number;
  risk_level_3: number;
  risk_level_4: number;
  congestion_level_1: number;
  congestion_level_2: number;
  congestion_level_3: number;
  congestion_level_molit_1: number;
  congestion_level_molit_2: number;
  congestion_level_molit_3: number;
  congestion_level_molit_4: number;
  data_count: number;
}

interface DailyData {
  key: string;
  date: string;
  dateFormatted: string;
  recordCount: number;
}

export default function DataManagement() {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<DailyData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(9, 'day'), // 오늘 포함 10일치 데이터
    dayjs(),
  ]);

  // 일별 데이터 조회
  const fetchData = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning('조회 기간을 선택해주세요.');
      return;
    }

    setLoading(true);
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');
    
    try {
      console.log('[DataManagement] 데이터 조회 시작:', { startDate, endDate });

      // 날짜별 집계 데이터 조회
      const response = await api.get<{
        data: Array<{
          date: string;
          record_count: number;
        }>;
      }>('/report/data/get5MinData', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      
      console.log('[DataManagement] API 응답 받음:', response);

      // API에서 받은 날짜별 데이터를 맵으로 변환
      const dailyMap = new Map<string, number>();
      response.data.forEach((item) => {
        dailyMap.set(item.date, item.record_count);
      });

      // 날짜별 목록 생성 (조회 기간 내 모든 날짜 포함)
      const dailyList: DailyData[] = [];
      let currentDate = dayjs(startDate);
      const endDateObj = dayjs(endDate);

      while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const recordCount = dailyMap.get(dateStr) || 0;
        dailyList.push({
          key: `date-${dateStr}`,
          date: dateStr,
          dateFormatted: currentDate.format('YYYY-MM-DD'),
          recordCount,
        });
        currentDate = currentDate.add(1, 'day');
      }

      // 날짜 역순 정렬 (최신 날짜가 위에)
      dailyList.reverse();

      setTableData(dailyList);
      message.success(`${dailyList.length}일의 데이터를 조회했습니다.`);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      console.error('[DataManagement] 요청 정보:', { startDate, endDate });
      
      // 에러 메시지 파싱
      let errorMessage = '데이터 조회에 실패했습니다.';
      if (error?.details) {
        if (typeof error.details === 'object') {
          errorMessage = error.details?.detail || error.details?.message || '데이터 조회에 실패했습니다.';
        } else {
          try {
            const parsed = JSON.parse(error.details);
            errorMessage = parsed?.detail || parsed?.message || error.details;
          } catch {
            errorMessage = error.details || '데이터 조회에 실패했습니다.';
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 날짜별 5분 데이터 다운로드
  const handleDownload5Min = async (date: string) => {
    const hide = message.loading('5분 데이터 다운로드 중...', 0);
    try {
      console.log('Downloading 5min data for date:', date);
      const blob = await api.blob('/report/data/download5MinData', {
        params: {
          start_date: date,
          end_date: date,
        },
      });

      console.log('Blob received:', blob.size, 'bytes, type:', blob.type);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const contentType = blob.type;
      const isExcel = contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('openxml');
      const extension = isExcel ? 'xlsx' : 'csv';
      link.setAttribute('download', `5분데이터_${date}.${extension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      hide();
      message.success(`5분 데이터 ${isExcel ? '엑셀' : 'CSV'} 파일 다운로드가 완료되었습니다.`);
    } catch (error: any) {
      hide();
      console.error('Failed to download 5min data:', error);
      const errorMessage = error?.details || error?.message || '알 수 없는 오류';
      message.error(`5분 데이터 다운로드에 실패했습니다: ${errorMessage}`);
    }
  };

  // 날짜별 15초 데이터 다운로드
  const handleDownload15s = async (date: string) => {
    const hide = message.loading('15초 데이터 다운로드 중...', 0);
    try {
      console.log('Downloading 15s data for date:', date);
      const blob = await api.blob('/report/data/download15sData', {
        params: {
          start_date: date,
          end_date: date,
        },
      });

      console.log('Blob received:', blob.size, 'bytes, type:', blob.type);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `15초데이터_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      hide();
      message.success('15초 데이터 CSV 파일 다운로드가 완료되었습니다.');
    } catch (error: any) {
      hide();
      console.error('Failed to download 15s data:', error);
      
      // 에러 메시지 파싱 (JSON 형식 또는 텍스트)
      let errorMessage = '알 수 없는 오류';
      if (error?.details) {
        // api.blob에서 이미 JSON 파싱을 시도했으므로, 객체일 수도 있고 문자열일 수도 있음
        if (typeof error.details === 'object') {
          errorMessage = error.details?.detail || error.details?.message || JSON.stringify(error.details);
        } else {
          // 문자열인 경우 JSON 파싱 시도
          try {
            const parsed = JSON.parse(error.details);
            errorMessage = parsed?.detail || parsed?.message || error.details;
          } catch {
            errorMessage = error.details;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // 404 에러인 경우 특별한 메시지 표시 (수동 다운로드 안내 포함)
      if (error?.status === 404) {
        message.error({
          content: errorMessage,
          duration: 10, // 10초간 표시
        });
      } else {
        message.error(`15초 데이터 다운로드에 실패했습니다: ${errorMessage}`);
      }
    }
  };

  // 날짜별 시간 간격별 데이터 다운로드 (15분, 30분, 1시간)
  const handleDownloadInterval = async (date: string, interval: string) => {
    const hide = message.loading(`${interval} 데이터 다운로드 중...`, 0);
    try {
      console.log(`Downloading ${interval} data for date:`, date);
      const blob = await api.blob('/report/data/downloadIntervalData', {
        params: {
          start_date: date,
          end_date: date,
          interval: interval,
        },
      });

      console.log('Blob received:', blob.size, 'bytes, type:', blob.type);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const contentType = blob.type;
      const isExcel = contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('openxml');
      const extension = isExcel ? 'xlsx' : 'csv';
      link.setAttribute('download', `${interval}데이터_${date}.${extension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      hide();
      message.success(`${interval} 데이터 ${isExcel ? '엑셀' : 'CSV'} 파일 다운로드가 완료되었습니다.`);
    } catch (error: any) {
      hide();
      console.error(`Failed to download ${interval} data:`, error);
      const errorMessage = error?.details || error?.message || '알 수 없는 오류';
      message.error(`${interval} 데이터 다운로드에 실패했습니다: ${errorMessage}`);
    }
  };

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>날짜</div>,
      dataIndex: 'dateFormatted',
      key: 'date',
      width: 150,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: <div style={{ textAlign: 'center' }}>레코드 수</div>,
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value?.toLocaleString() || '0',
    },
    {
      title: <div style={{ textAlign: 'center' }}>다운로드</div>,
      key: 'download',
      width: 600,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: DailyData) => (
        <Space size="small" wrap>
          <Button 
            size="small"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload15s(record.date)}
            disabled={record.recordCount === 0}
          >
            15초
          </Button>
          <Button 
            size="small"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload5Min(record.date)}
            disabled={record.recordCount === 0}
          >
            5분
          </Button>
          <Button 
            size="small"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInterval(record.date, '15분')}
            disabled={record.recordCount === 0}
          >
            15분
          </Button>
          <Button 
            size="small"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInterval(record.date, '30분')}
            disabled={record.recordCount === 0}
          >
            30분
          </Button>
          <Button 
            size="small"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInterval(record.date, '1시간')}
            disabled={record.recordCount === 0}
          >
            1시간
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>데이터 관리</Title>
      </div>

      {/* 검색 조건 */}
      <Card variant="borderless" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Text strong>조회 기간:</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            format="YYYY-MM-DD"
          />
          <Button type="primary" onClick={fetchData} loading={loading}>
            조회
          </Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card variant="borderless">
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
          }}
          scroll={{ x: 'max-content', y: undefined }}
          size="middle"
        />
      </Card>
    </div>
  );
}

