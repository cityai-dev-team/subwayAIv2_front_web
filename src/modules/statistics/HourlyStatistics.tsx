import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, Table, DatePicker, Select, Button, Space, Tabs, Tag, Modal } from 'antd';
import { DownloadOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
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

export default function HourlyStatistics() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [chartTypeTab, setChartTypeTab] = useState<string>('traffic'); // 차트 타입 탭 (traffic, congestion_ratio, congestion_ratio_molit, congestion_level, risk_level, congestion_level_molit_dist)
  const [selectedDates, setSelectedDates] = useState<Dayjs[]>([dayjs()]); // 선택된 날짜 배열 (최대 2개)
  const [tempDatePickerValue, setTempDatePickerValue] = useState<Dayjs | null>(null); // DatePicker 임시 값
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCCTV, setSelectedCCTV] = useState<string>('all');
  const [selectedInterval, setSelectedInterval] = useState<string>('1시간');
  const [regions, setRegions] = useState<Array<{ region_id: string; region_name: string }>>([]);
  const [allCCTVs, setAllCCTVs] = useState<Array<{ cctv_uid: number; cctv_id: string; cctv_name: string; region_id: string }>>([]);
  const [cctvs, setCCTVs] = useState<Array<{ cctv_uid: number; cctv_id: string; cctv_name: string }>>([]);
  const [graphDetailModalOpen, setGraphDetailModalOpen] = useState<boolean>(false);
  // 상세보기 모달 내부 상태
  const [detailChartTypeTab, setDetailChartTypeTab] = useState<string>('traffic');
  const [detailSelectedDates, setDetailSelectedDates] = useState<Dayjs[]>([dayjs()]);
  const [detailTempDatePickerValue, setDetailTempDatePickerValue] = useState<Dayjs | null>(null);
  const [detailSelectedRegion, setDetailSelectedRegion] = useState<string>('all');
  const [detailSelectedCCTV, setDetailSelectedCCTV] = useState<string>('all');
  const [detailSelectedInterval, setDetailSelectedInterval] = useState<string>('1시간');
  const [detailCCTVs, setDetailCCTVs] = useState<Array<{ cctv_uid: number; cctv_id: string; cctv_name: string }>>([]);
  const [detailChartData, setDetailChartData] = useState<ChartData[]>([]);
  const [detailTableData, setDetailTableData] = useState<TableData[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

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


  // 날짜 추가 핸들러
  const handleDateAdd = (date: Dayjs | null) => {
    if (!date) return;
    
    const dateStr = date.format('YYYY-MM-DD');
    // 이미 선택된 날짜인지 확인
    const isAlreadySelected = selectedDates.some(d => d.format('YYYY-MM-DD') === dateStr);
    
    if (isAlreadySelected) {
      // 이미 선택된 날짜면 제거
      setSelectedDates(selectedDates.filter(d => d.format('YYYY-MM-DD') !== dateStr));
    } else {
      // 최대 2개까지만 선택 가능
      if (selectedDates.length >= 2) {
        // 첫 번째 날짜 제거하고 새 날짜 추가
        setSelectedDates([selectedDates[1], date]);
      } else {
        setSelectedDates([...selectedDates, date].sort((a, b) => a.valueOf() - b.valueOf()));
      }
    }
    setTempDatePickerValue(null);
  };

  // 날짜 제거 핸들러
  const handleDateRemove = (dateToRemove: Dayjs) => {
    setSelectedDates(selectedDates.filter(d => d.format('YYYY-MM-DD') !== dateToRemove.format('YYYY-MM-DD')));
  };

  // 상세보기 모달용 날짜 추가 핸들러
  const handleDetailDateAdd = (date: Dayjs | null) => {
    if (!date) return;
    
    const dateStr = date.format('YYYY-MM-DD');
    const isAlreadySelected = detailSelectedDates.some(d => d.format('YYYY-MM-DD') === dateStr);
    
    if (isAlreadySelected) {
      setDetailSelectedDates(detailSelectedDates.filter(d => d.format('YYYY-MM-DD') !== dateStr));
    } else {
      if (detailSelectedDates.length >= 2) {
        setDetailSelectedDates([detailSelectedDates[1], date]);
      } else {
        setDetailSelectedDates([...detailSelectedDates, date].sort((a, b) => a.valueOf() - b.valueOf()));
      }
    }
    setDetailTempDatePickerValue(null);
  };

  // 상세보기 모달용 날짜 제거 핸들러
  const handleDetailDateRemove = (dateToRemove: Dayjs) => {
    setDetailSelectedDates(detailSelectedDates.filter(d => d.format('YYYY-MM-DD') !== dateToRemove.format('YYYY-MM-DD')));
  };

  // 데이터 가져오기 (5분 집계 테이블 기반)
  const fetchData = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 최소 1개 날짜는 선택되어야 함
    if (selectedDates.length === 0) {
      return;
    }
    
    setLoading(true);
    try {
      // 선택된 날짜들을 배열로 전달
      const dates = selectedDates.map(d => d.format('YYYY-MM-DD'));
      
      // 실제 API 엔드포인트 호출
      const params: any = {
        dates: dates, // 날짜 배열로 전달
        interval: selectedInterval,
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
      }>('/report/getHourlyStatistics', { params });
      
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
        const rowAny = row as any;
        timeGroupedData[time].congestion_level.하 += rowAny.congestion_level_1 || 0;
        timeGroupedData[time].congestion_level.중 += rowAny.congestion_level_2 || 0;
        timeGroupedData[time].congestion_level.상 += rowAny.congestion_level_3 || 0;
        timeGroupedData[time].congestion_level.total += (rowAny.congestion_level_1 || 0) + (rowAny.congestion_level_2 || 0) + (rowAny.congestion_level_3 || 0);
        
        // 혼잡지속도 분포 집계
        timeGroupedData[time].risk_level.관심 += rowAny.risk_level_1 || 0;
        timeGroupedData[time].risk_level.주의 += rowAny.risk_level_2 || 0;
        timeGroupedData[time].risk_level.경계 += rowAny.risk_level_3 || 0;
        timeGroupedData[time].risk_level.심각 += rowAny.risk_level_4 || 0;
        timeGroupedData[time].risk_level.total += (rowAny.risk_level_1 || 0) + (rowAny.risk_level_2 || 0) + (rowAny.risk_level_3 || 0) + (rowAny.risk_level_4 || 0);
        
        // 혼잡도(국토부) 분포 집계
        timeGroupedData[time].congestion_level_molit_dist.보통 += rowAny.congestion_level_molit_1 || 0;
        timeGroupedData[time].congestion_level_molit_dist.주의 += rowAny.congestion_level_molit_2 || 0;
        timeGroupedData[time].congestion_level_molit_dist.혼잡 += rowAny.congestion_level_molit_3 || 0;
        timeGroupedData[time].congestion_level_molit_dist.심각 += rowAny.congestion_level_molit_4 || 0;
        timeGroupedData[time].congestion_level_molit_dist.total += (rowAny.congestion_level_molit_1 || 0) + (rowAny.congestion_level_molit_2 || 0) + (rowAny.congestion_level_molit_3 || 0) + (rowAny.congestion_level_molit_4 || 0);
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
      
      // 테이블 데이터 설정 (key 추가 및 CCTV 개수 계산)
      // 시간대별, 구역별 CCTV 개수 집계
      const cctvCountMap: { [key: string]: number } = {};
      response.table_data.forEach(row => {
        const key = `${row.time}_${row.region_name}`;
        // cctv_name이 "-"가 아니고 실제 CCTV 이름인 경우 카운트
        if (row.cctv_name && row.cctv_name !== '-' && row.cctv_name !== '전체') {
          if (!cctvCountMap[key]) {
            cctvCountMap[key] = 0;
          }
          cctvCountMap[key] += 1;
        }
      });
      
      const tableDataWithKeys = response.table_data.map((item, index) => {
        const key = `${item.time}_${item.region_name}`;
        const cctvCount = cctvCountMap[key] || 0;
        
        // "전체" 행이거나 cctv_name이 "-"인 경우 CCTV 개수 표시
        let cctvDisplay = item.cctv_name;
        if (item.cctv_name === '-' || item.cctv_name === '전체' || !item.cctv_name) {
          cctvDisplay = cctvCount > 0 ? `${cctvCount}개` : '-';
        }
        
        return {
          ...item,
          key: `table-${index}`,
          cctv_name: cctvDisplay,
          cctv_count: cctvCount, // 원본 개수도 저장 (필요시 사용)
        };
      });
      setTableData(tableDataWithKeys);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // 에러 발생 시 빈 데이터 설정
      setChartData([]);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDates, selectedRegion, selectedCCTV, selectedInterval, regions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 상세보기 모달 전용 데이터 가져오기 함수 (부모창 조건 사용)
  const fetchDetailData = useCallback(async () => {
    if (selectedDates.length === 0) {
      return;
    }
    
    setDetailLoading(true);
    try {
      const dates = selectedDates.map(d => d.format('YYYY-MM-DD'));
      
      const params: any = {
        dates: dates,
        interval: selectedInterval,
      };
      
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
      }>('/report/getHourlyStatistics', { params });
      
      const chartDataWithKeys = response.chart_data.map((item, index) => ({
        ...item,
        key: `detail-chart-${index}`,
      }));
      
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
        
        const rowAny = row as any;
        timeGroupedData[time].congestion_level.하 += rowAny.congestion_level_1 || 0;
        timeGroupedData[time].congestion_level.중 += rowAny.congestion_level_2 || 0;
        timeGroupedData[time].congestion_level.상 += rowAny.congestion_level_3 || 0;
        timeGroupedData[time].congestion_level.total += (rowAny.congestion_level_1 || 0) + (rowAny.congestion_level_2 || 0) + (rowAny.congestion_level_3 || 0);
        
        timeGroupedData[time].risk_level.관심 += rowAny.risk_level_1 || 0;
        timeGroupedData[time].risk_level.주의 += rowAny.risk_level_2 || 0;
        timeGroupedData[time].risk_level.경계 += rowAny.risk_level_3 || 0;
        timeGroupedData[time].risk_level.심각 += rowAny.risk_level_4 || 0;
        timeGroupedData[time].risk_level.total += (rowAny.risk_level_1 || 0) + (rowAny.risk_level_2 || 0) + (rowAny.risk_level_3 || 0) + (rowAny.risk_level_4 || 0);
        
        timeGroupedData[time].congestion_level_molit_dist.보통 += rowAny.congestion_level_molit_1 || 0;
        timeGroupedData[time].congestion_level_molit_dist.주의 += rowAny.congestion_level_molit_2 || 0;
        timeGroupedData[time].congestion_level_molit_dist.혼잡 += rowAny.congestion_level_molit_3 || 0;
        timeGroupedData[time].congestion_level_molit_dist.심각 += rowAny.congestion_level_molit_4 || 0;
        timeGroupedData[time].congestion_level_molit_dist.total += (rowAny.congestion_level_molit_1 || 0) + (rowAny.congestion_level_molit_2 || 0) + (rowAny.congestion_level_molit_3 || 0) + (rowAny.congestion_level_molit_4 || 0);
      });
      
      chartDataWithKeys.forEach(item => {
        const time = item.time;
        if (timeGroupedData[time]) {
          const data = timeGroupedData[time];
          
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
          item.congestion_level = { 하: 0, 중: 0, 상: 0 };
          item.risk_level = { 관심: 0, 주의: 0, 경계: 0, 심각: 0 };
          item.congestion_level_molit_dist = { 보통: 0, 주의: 0, 혼잡: 0, 심각: 0 };
        }
      });
      
      setDetailChartData(chartDataWithKeys);
      
      const cctvCountMap: { [key: string]: number } = {};
      response.table_data.forEach(row => {
        const key = `${row.time}_${row.region_name}`;
        if (row.cctv_name && row.cctv_name !== '-' && row.cctv_name !== '전체') {
          if (!cctvCountMap[key]) {
            cctvCountMap[key] = 0;
          }
          cctvCountMap[key] += 1;
        }
      });
      
      const tableDataWithKeys = response.table_data.map((item, index) => {
        const key = `${item.time}_${item.region_name}`;
        const cctvCount = cctvCountMap[key] || 0;
        
        let cctvDisplay = item.cctv_name;
        if (item.cctv_name === '-' || item.cctv_name === '전체' || !item.cctv_name) {
          cctvDisplay = cctvCount > 0 ? `${cctvCount}개` : '-';
        }
        
        return {
          ...item,
          key: `detail-table-${index}`,
          cctv_name: cctvDisplay,
          cctv_count: cctvCount,
        };
      });
      setDetailTableData(tableDataWithKeys);
    } catch (error) {
      console.error('Failed to fetch detail statistics:', error);
      setDetailChartData([]);
      setDetailTableData([]);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedDates, selectedInterval]);

  // 상세보기 모달 조건 변경 시 데이터 가져오기 (부모창 조건 사용)
  useEffect(() => {
    if (graphDetailModalOpen && selectedDates.length > 0) {
      fetchDetailData();
    }
  }, [graphDetailModalOpen, selectedDates, selectedInterval, fetchDetailData]);

  // Chart.js 옵션 생성 함수
  const getChartOptions = (type: string, customSelectedInterval?: string, isRegionChart: boolean = false) => {
    const isTraffic = type === 'traffic';
    const isDistribution = ['congestion_level', 'risk_level', 'congestion_level_molit_dist'].includes(type);
    const isCongestionRatio = ['congestion_ratio', 'congestion_ratio_molit'].includes(type);
    const dataSelectedInterval = customSelectedInterval || selectedInterval;
    
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
              const value = context.parsed.y;
              if (value === null || value === undefined || isNaN(value)) {
                return `${context.dataset.label}: 데이터 없음`;
              }
              if (isTraffic) {
                return `${context.dataset.label}: ${value.toLocaleString()}명`;
              } else if (isDistribution) {
                return `${context.dataset.label}: ${value.toFixed(1)}%`;
              } else {
                return `${context.dataset.label}: ${value.toFixed(1)}%`;
              }
            }
          }
        },
        // 모든 값 표시 비활성화
        datalabels: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: (isDistribution || isCongestionRatio) ? 100 : (isTraffic && isRegionChart ? 50000 : undefined),
          title: {
            display: true,
            text: isTraffic ? 'Traffic (명)' : isDistribution ? '비율 (%)' : '혼잡도 (%)'
          },
          // 분포 차트는 항상 스택형으로 표시
          stacked: isDistribution,
        },
        x: {
          title: {
            display: true,
            text: '시간'
          },
          // 분포 차트는 항상 스택형으로 표시
          stacked: isDistribution,
          ticks: {
            callback: function(value: any, _index: number) {
              const label = (this as any).getLabelForValue(value);
              // interval에 따라 다른 포맷 처리
              if (dataSelectedInterval === '1시간') {
                // "HH:00" 형식에서 "HH"만 반환
                if (label && typeof label === 'string' && label.includes(':')) {
                  return label.split(':')[0];
                }
                return label;
              } else {
                // 5분, 15분, 30분의 경우 전체 시간 문자열 반환
                return label;
              }
            }
          }
        }
      }
    };
  };

  // Chart.js 데이터 생성
  const getChartData = (
    type: string, 
    filterRegionId?: string,
    customChartData?: ChartData[],
    customTableData?: TableData[],
    customSelectedDates?: Dayjs[],
    customSelectedInterval?: string,
    customSelectedRegion?: string,
    customSelectedCCTV?: string,
    customCCTVs?: Array<{ cctv_uid: number; cctv_id: string; cctv_name: string }>,
    customRegions?: Array<{ region_id: string; region_name: string }>
  ) => {
    const dataChartData = customChartData || chartData;
    const dataTableData = customTableData || tableData;
    const dataSelectedDates = customSelectedDates || selectedDates;
    const dataSelectedInterval = customSelectedInterval || selectedInterval;
    const dataSelectedRegion = customSelectedRegion || selectedRegion;
    const dataSelectedCCTV = customSelectedCCTV || selectedCCTV;
    const dataCCTVs = customCCTVs || cctvs;
    const dataRegions = customRegions || regions;
    
    if (dataChartData.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // 시간 라벨 추출 (interval에 따라 포맷 변경, 중복 제거)
    const timeLabels = dataChartData.map(d => {
      const timeStr = d.time as string;
      // interval에 따라 다른 포맷 처리
      if (dataSelectedInterval === '1시간') {
        // "YYYY-MM-DD HH:00" 형식에서 "HH"만 추출
        if (timeStr.includes(' ')) {
          const timePart = timeStr.split(' ')[1];
          if (timePart.includes(':')) {
            return timePart.split(':')[0];
          }
          return timePart;
        }
        if (timeStr.includes(':')) {
          return timeStr.split(':')[0];
        }
        return timeStr;
      } else {
        // 5분, 15분, 30분의 경우 "YYYY-MM-DD HH:MM" 형식에서 "HH:MM" 추출
        if (timeStr.includes(' ')) {
          return timeStr.split(' ')[1];
        }
        return timeStr;
      }
    });
    
    // 중복 제거하여 고유한 시간 라벨만 유지
    const labels = Array.from(new Set(timeLabels));
    
    const datasets: any[] = [];
    const isTraffic = type === 'traffic';
    const isDistribution = ['congestion_level', 'risk_level', 'congestion_level_molit_dist'].includes(type);
    
    // 분포 차트인 경우
    if (isDistribution) {
      // 구역별 필터링: filterRegionId가 있으면 해당 구역의 tableData에서 집계
      let filteredTableData = dataTableData;
      if (filterRegionId && filterRegionId !== 'all') {
        const selectedRegionData = dataRegions.find(r => r.region_id === filterRegionId);
        if (selectedRegionData) {
          filteredTableData = dataTableData.filter(row => row.region_name === selectedRegionData.region_name);
        }
      } else if (!filterRegionId || filterRegionId === 'all') {
        // 전체인 경우 "전체" 행만 필터링
        filteredTableData = dataTableData.filter(row => row.region_name === '전체');
      }
      
      // 필터링된 tableData에서 시간대별 분포 데이터 집계
      const timeGroupedData: { [time: string]: any } = {};
      // 디버깅: 필터링된 데이터 확인
      if (filterRegionId === undefined || filterRegionId === 'all') {
        console.log('Distribution chart - filteredTableData:', filteredTableData.length, filteredTableData.slice(0, 3));
      }
      filteredTableData.forEach(row => {
        const time = row.time;
        if (!timeGroupedData[time]) {
          timeGroupedData[time] = {
            congestion_level: { 하: 0, 중: 0, 상: 0, total: 0 },
            risk_level: { 관심: 0, 주의: 0, 경계: 0, 심각: 0, total: 0 },
            congestion_level_molit_dist: { 보통: 0, 주의: 0, 혼잡: 0, 심각: 0, total: 0 },
          };
        }
        
        const rowAny = row as any;
        timeGroupedData[time].congestion_level.하 += rowAny.congestion_level_1 || 0;
        timeGroupedData[time].congestion_level.중 += rowAny.congestion_level_2 || 0;
        timeGroupedData[time].congestion_level.상 += rowAny.congestion_level_3 || 0;
        timeGroupedData[time].congestion_level.total += (rowAny.congestion_level_1 || 0) + (rowAny.congestion_level_2 || 0) + (rowAny.congestion_level_3 || 0);
        
        timeGroupedData[time].risk_level.관심 += rowAny.risk_level_1 || 0;
        timeGroupedData[time].risk_level.주의 += rowAny.risk_level_2 || 0;
        timeGroupedData[time].risk_level.경계 += rowAny.risk_level_3 || 0;
        timeGroupedData[time].risk_level.심각 += rowAny.risk_level_4 || 0;
        timeGroupedData[time].risk_level.total += (rowAny.risk_level_1 || 0) + (rowAny.risk_level_2 || 0) + (rowAny.risk_level_3 || 0) + (rowAny.risk_level_4 || 0);
        
        timeGroupedData[time].congestion_level_molit_dist.보통 += rowAny.congestion_level_molit_1 || 0;
        timeGroupedData[time].congestion_level_molit_dist.주의 += rowAny.congestion_level_molit_2 || 0;
        timeGroupedData[time].congestion_level_molit_dist.혼잡 += rowAny.congestion_level_molit_3 || 0;
        timeGroupedData[time].congestion_level_molit_dist.심각 += rowAny.congestion_level_molit_4 || 0;
        timeGroupedData[time].congestion_level_molit_dist.total += (rowAny.congestion_level_molit_1 || 0) + (rowAny.congestion_level_molit_2 || 0) + (rowAny.congestion_level_molit_3 || 0) + (rowAny.congestion_level_molit_4 || 0);
      });
      
      // 날짜별로 다른 색상 적용 (2개 날짜 선택 시)
      if (dataSelectedDates.length > 1) {
        // 레벨별 통일된 색상 팔레트 (날짜와 관계없이 동일한 색상 사용)
        const levelColorPalette = {
          하: { bg: 'rgba(82, 196, 26, 0.8)', border: '#52c41a' }, // 녹색
          중: { bg: 'rgba(250, 173, 20, 0.8)', border: '#faad14' }, // 노란색
          상: { bg: 'rgba(245, 34, 45, 0.8)', border: '#f5222d' }, // 빨간색
          관심: { bg: 'rgba(82, 196, 26, 0.8)', border: '#52c41a' }, // 녹색
          주의: { bg: 'rgba(250, 173, 20, 0.8)', border: '#faad14' }, // 노란색
          경계: { bg: 'rgba(250, 140, 22, 0.8)', border: '#fa8c16' }, // 주황색
          심각: { bg: 'rgba(245, 34, 45, 0.8)', border: '#f5222d' }, // 빨간색
          보통: { bg: 'rgba(82, 196, 26, 0.8)', border: '#52c41a' }, // 녹색
          혼잡: { bg: 'rgba(250, 140, 22, 0.8)', border: '#fa8c16' }, // 주황색
        };
        
        dataSelectedDates.forEach((date, dateIndex) => {
          const dateStr = date.format('YYYY-MM-DD');
          
          // 해당 날짜의 데이터만 필터링하여 labels와 매칭
          const getDateData = (levelKey: string) => {
            return labels.map((label) => {
              // timeGroupedData의 키를 직접 생성해서 찾기
              let timeKey = '';
              if (dataSelectedInterval === '1시간') {
                // label이 "00", "01" 형식이므로 "YYYY-MM-DD HH:00" 형식으로 키 생성
                timeKey = `${dateStr} ${label}:00`;
              } else {
                // label이 "00:00", "00:05" 형식이므로 "YYYY-MM-DD HH:MM" 형식으로 키 생성
                timeKey = `${dateStr} ${label}`;
              }
              
              // 디버깅: 첫 번째 라벨만 로그 출력
              if (label === labels[0] && levelKey === (type === 'congestion_level' ? '하' : type === 'risk_level' ? '관심' : '보통')) {
                console.log('Looking for timeKey:', timeKey, 'Found:', timeKey in timeGroupedData, 'Available keys:', Object.keys(timeGroupedData).slice(0, 5));
              }
              
              if (timeGroupedData[timeKey]) {
                const data = timeGroupedData[timeKey];
                let value = 0;
                
                if (type === 'congestion_level') {
                  const total = data.congestion_level.total;
                  value = total > 0 ? (data.congestion_level[levelKey] / total) * 100 : 0;
                } else if (type === 'risk_level') {
                  const total = data.risk_level.total;
                  value = total > 0 ? (data.risk_level[levelKey] / total) * 100 : 0;
                } else if (type === 'congestion_level_molit_dist') {
                  const total = data.congestion_level_molit_dist.total;
                  value = total > 0 ? (data.congestion_level_molit_dist[levelKey] / total) * 100 : 0;
                }
                
                return value;
              }
              return 0;
            });
          };
          
          if (type === 'congestion_level') {
            // 혼잡도 분포: 하, 중, 상
            // 같은 stack 값을 사용하여 같은 날짜의 데이터가 하나의 막대에 스택됨
            const stackId = `date${dateIndex}`;
            datasets.push({
              type: 'bar' as const,
              label: `하 (${dateStr})`,
              data: getDateData('하'),
              backgroundColor: levelColorPalette.하.bg,
              borderColor: levelColorPalette.하.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `중 (${dateStr})`,
              data: getDateData('중'),
              backgroundColor: levelColorPalette.중.bg,
              borderColor: levelColorPalette.중.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `상 (${dateStr})`,
              data: getDateData('상'),
              backgroundColor: levelColorPalette.상.bg,
              borderColor: levelColorPalette.상.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
          } else if (type === 'risk_level') {
            // 혼잡지속도 분포: 관심, 주의, 경계, 심각
            // 같은 stack 값을 사용하여 같은 날짜의 데이터가 하나의 막대에 스택됨
            const stackId = `date${dateIndex}`;
            datasets.push({
              type: 'bar' as const,
              label: `관심 (${dateStr})`,
              data: getDateData('관심'),
              backgroundColor: levelColorPalette.관심.bg,
              borderColor: levelColorPalette.관심.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `주의 (${dateStr})`,
              data: getDateData('주의'),
              backgroundColor: levelColorPalette.주의.bg,
              borderColor: levelColorPalette.주의.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `경계 (${dateStr})`,
              data: getDateData('경계'),
              backgroundColor: levelColorPalette.경계.bg,
              borderColor: levelColorPalette.경계.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `심각 (${dateStr})`,
              data: getDateData('심각'),
              backgroundColor: levelColorPalette.심각.bg,
              borderColor: levelColorPalette.심각.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
          } else if (type === 'congestion_level_molit_dist') {
            // 혼잡도(국토부) 분포: 보통, 주의, 혼잡, 심각
            // 같은 stack 값을 사용하여 같은 날짜의 데이터가 하나의 막대에 스택됨
            const stackId = `date${dateIndex}`;
            datasets.push({
              type: 'bar' as const,
              label: `보통 (${dateStr})`,
              data: getDateData('보통'),
              backgroundColor: levelColorPalette.보통.bg,
              borderColor: levelColorPalette.보통.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `주의 (${dateStr})`,
              data: getDateData('주의'),
              backgroundColor: levelColorPalette.주의.bg,
              borderColor: levelColorPalette.주의.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `혼잡 (${dateStr})`,
              data: getDateData('혼잡'),
              backgroundColor: levelColorPalette.혼잡.bg,
              borderColor: levelColorPalette.혼잡.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
            datasets.push({
              type: 'bar' as const,
              label: `심각 (${dateStr})`,
              data: getDateData('심각'),
              backgroundColor: levelColorPalette.심각.bg,
              borderColor: levelColorPalette.심각.border,
              borderWidth: 1,
              yAxisID: 'y',
              stack: stackId,
            });
          }
        });
      } else {
        // 단일 날짜인 경우 (스택형 막대)
        const stackId = 'single';
        
        // timeGroupedData에서 labels에 맞춰 데이터 추출
        const getLevelData = (levelKey: string) => {
          return labels.map((label) => {
            // timeGroupedData에서 해당 시간대 데이터 찾기
            const timeKey = Object.keys(timeGroupedData).find(time => {
              const timeStr = time as string;
              let itemTimeStr = '';
              
              if (timeStr.includes(' ')) {
                itemTimeStr = timeStr.split(' ')[1];
              } else {
                itemTimeStr = timeStr;
              }
              
              let matchesTime = false;
              if (selectedInterval === '1시간') {
                const hour = itemTimeStr.includes(':') ? itemTimeStr.split(':')[0] : itemTimeStr;
                matchesTime = hour === label;
              } else {
                matchesTime = itemTimeStr === label;
              }
              
              return matchesTime;
            });
            
            if (timeKey && timeGroupedData[timeKey]) {
              const data = timeGroupedData[timeKey];
              let value = 0;
              
              if (type === 'congestion_level') {
                const total = data.congestion_level.total;
                value = total > 0 ? (data.congestion_level[levelKey] / total) * 100 : 0;
              } else if (type === 'risk_level') {
                const total = data.risk_level.total;
                value = total > 0 ? (data.risk_level[levelKey] / total) * 100 : 0;
              } else if (type === 'congestion_level_molit_dist') {
                const total = data.congestion_level_molit_dist.total;
                value = total > 0 ? (data.congestion_level_molit_dist[levelKey] / total) * 100 : 0;
              }
              
              return value;
            }
            return 0;
          });
        };
        
        if (type === 'congestion_level') {
          // 혼잡도 분포: 하, 중, 상
          datasets.push({
            type: 'bar' as const,
            label: '하',
            data: getLevelData('하'),
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '중',
            data: getLevelData('중'),
            backgroundColor: '#faad14',
            borderColor: '#faad14',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '상',
            data: getLevelData('상'),
            backgroundColor: '#f5222d',
            borderColor: '#f5222d',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
        } else if (type === 'risk_level') {
          // 혼잡지속도 분포: 관심, 주의, 경계, 심각
          datasets.push({
            type: 'bar' as const,
            label: '관심',
            data: getLevelData('관심'),
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '주의',
            data: getLevelData('주의'),
            backgroundColor: '#faad14',
            borderColor: '#faad14',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '경계',
            data: getLevelData('경계'),
            backgroundColor: '#fa8c16',
            borderColor: '#fa8c16',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '심각',
            data: getLevelData('심각'),
            backgroundColor: '#f5222d',
            borderColor: '#f5222d',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
        } else if (type === 'congestion_level_molit_dist') {
          // 혼잡도(국토부) 분포: 보통, 주의, 혼잡, 심각
          datasets.push({
            type: 'bar' as const,
            label: '보통',
            data: getLevelData('보통'),
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '주의',
            data: getLevelData('주의'),
            backgroundColor: '#faad14',
            borderColor: '#faad14',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '혼잡',
            data: getLevelData('혼잡'),
            backgroundColor: '#fa8c16',
            borderColor: '#fa8c16',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
          datasets.push({
            type: 'bar' as const,
            label: '심각',
            data: getLevelData('심각'),
            backgroundColor: '#f5222d',
            borderColor: '#f5222d',
            borderWidth: 1,
            yAxisID: 'y',
            stack: stackId,
          });
        }
      }
    } else {
      // 기존 차트 (Traffic, 혼잡비율, 혼잡비율(국토부))
      const metricData = dataChartData.map(d => d[type as keyof ChartData] as any);
      const isRatio = type === 'congestion_ratio' || type === 'congestion_ratio_molit';
      
      // CCTV 선택 시 테이블 데이터에서 CCTV별 데이터 집계
      if (dataSelectedCCTV !== 'all') {
        const selectedCCTVData = dataCCTVs.find(c => String(c.cctv_uid) === dataSelectedCCTV);
        if (selectedCCTVData) {
          // 테이블 데이터에서 해당 CCTV의 데이터만 필터링하여 시간별 집계
          const cctvTableData = dataTableData.filter(row => row.cctv_name === selectedCCTVData.cctv_name);
          
          // 날짜별로 다른 색상 적용 (2개 날짜 선택 시)
          if (dataSelectedDates.length > 1) {
            const dateColors = [
              { bg: 'rgba(24, 144, 255, 0.6)', border: '#1890ff' }, // 첫 번째 날짜: 파란색
              { bg: 'rgba(255, 77, 79, 0.6)', border: '#ff4d4f' }, // 두 번째 날짜: 빨간색
            ];
            
            dataSelectedDates.forEach((date, dateIndex) => {
              const dateStr = date.format('YYYY-MM-DD');
              const dateLabel = `${selectedCCTVData.cctv_name} (${dateStr})`;
              
              // 해당 날짜의 데이터만 필터링하여 시간별 집계
              const dateCctvTableData = cctvTableData.filter(row => {
                const timeStr = row.time as string;
                let itemDateStr = '';
                if (timeStr.includes(' ')) {
                  itemDateStr = timeStr.split(' ')[0];
                }
                return itemDateStr === dateStr;
              });
              
              const timeGrouped: { [time: string]: any } = {};
              
              dateCctvTableData.forEach(row => {
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
                // timeGrouped에서 해당 날짜와 시간이 일치하는 데이터 찾기
                const timeKey = Object.keys(timeGrouped).find(time => {
                  const timeStr = time as string;
                  let itemTimeStr = '';
                  let itemDateStr = '';
                  
                  if (timeStr.includes(' ')) {
                    const parts = timeStr.split(' ');
                    itemDateStr = parts[0];
                    itemTimeStr = parts[1];
                  } else {
                    itemTimeStr = timeStr;
                  }
                  
                  if (itemDateStr !== dateStr) return false;
                  
                  let matchesTime = false;
                  if (dataSelectedInterval === '1시간') {
                    const hour = itemTimeStr.includes(':') ? itemTimeStr.split(':')[0] : itemTimeStr;
                    matchesTime = hour === label;
                  } else {
                    matchesTime = itemTimeStr === label;
                  }
                  
                  return matchesTime;
                });
                
                if (timeKey && timeGrouped[timeKey]) {
                  const grouped = timeGrouped[timeKey];
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
                label: dateLabel,
                data: cctvChartData,
                backgroundColor: isRatio ? dateColors[dateIndex].bg.replace('0.6', '0.1') : dateColors[dateIndex].bg,
                borderColor: dateColors[dateIndex].border,
                borderWidth: isRatio ? 2 : 1,
                tension: isRatio ? 0.1 : undefined,
                fill: isRatio ? false : undefined,
                pointRadius: isRatio ? 3 : undefined,
                pointHoverRadius: isRatio ? 5 : undefined,
                yAxisID: 'y',
              });
            });
          } else {
            // 단일 날짜인 경우 기존 방식 유지
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
              // label 형식에 따라 chartData에서 해당 시간대 찾기
              const chartItem = dataChartData.find(d => {
                const timeStr = d.time as string;
                if (dataSelectedInterval === '1시간') {
                  const hour = timeStr.includes(' ') ? timeStr.split(' ')[1].split(':')[0] : timeStr.split(':')[0];
                  return hour === label;
                } else {
                  // 5분, 15분, 30분의 경우 전체 시간 문자열 비교
                  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
                  return timePart === label;
                }
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
        }
      } else {
        // filterRegionId가 있으면 해당 구역만 표시, 없으면 dataSelectedRegion 사용
        const targetRegionId = filterRegionId || dataSelectedRegion;
        
        if (targetRegionId === 'all') {
          // 전체 선택 시: 전체 데이터만 표시
          // 날짜별로 다른 색상 적용 (2개 날짜 선택 시)
          if (dataSelectedDates.length > 1) {
            const dateColors = [
              { bg: 'rgba(24, 144, 255, 0.6)', border: '#1890ff' }, // 첫 번째 날짜: 파란색
              { bg: 'rgba(255, 77, 79, 0.6)', border: '#ff4d4f' }, // 두 번째 날짜: 빨간색
            ];
            
            dataSelectedDates.forEach((date, dateIndex) => {
              const dateStr = date.format('YYYY-MM-DD');
              const dateLabel = `전체 ${isTraffic ? 'Traffic' : '혼잡도'} (${dateStr})`;
              
              // 해당 날짜의 데이터만 필터링하여 labels와 매칭
              const dateData = labels.map((label) => {
                const chartItem = dataChartData.find(d => {
                  const timeStr = d.time as string;
                  let itemTimeStr = '';
                  let itemDateStr = '';
                  
                  if (timeStr.includes(' ')) {
                    const parts = timeStr.split(' ');
                    itemDateStr = parts[0];
                    itemTimeStr = parts[1];
                  } else {
                    itemTimeStr = timeStr;
                  }
                  
                  // 시간 비교 (interval에 따라)
                  let matchesTime = false;
                  if (dataSelectedInterval === '1시간') {
                    const hour = itemTimeStr.includes(':') ? itemTimeStr.split(':')[0] : itemTimeStr;
                    matchesTime = hour === label;
                  } else {
                    matchesTime = itemTimeStr === label;
                  }
                  
                  return itemDateStr === dateStr && matchesTime;
                });
                
                if (chartItem) {
                  const itemIndex = dataChartData.indexOf(chartItem);
                  if (itemIndex >= 0 && itemIndex < metricData.length) {
                    const value = metricData[itemIndex]?.전체 || 0;
                    // 디버깅: 첫 번째 라벨만 로그 출력
                    if (label === labels[0] && dateIndex === 0) {
                      console.log('Traffic chart - dateData:', { dateStr, label, itemIndex, value, chartItemTime: chartItem.time });
                    }
                    return value;
                  }
                }
                // 디버깅: 첫 번째 라벨만 로그 출력
                if (label === labels[0] && dateIndex === 0) {
                  console.log('Traffic chart - no chartItem found:', { dateStr, label, dataChartDataLength: dataChartData.length, sampleTimes: dataChartData.slice(0, 3).map(d => d.time) });
                }
                return 0;
              });
              
              datasets.push({
                type: isRatio ? 'line' as const : 'bar' as const,
                label: dateLabel,
                data: dateData,
                backgroundColor: isRatio ? dateColors[dateIndex].bg.replace('0.6', '0.1') : dateColors[dateIndex].bg,
                borderColor: dateColors[dateIndex].border,
                borderWidth: isRatio ? 2 : 1,
                tension: isRatio ? 0.1 : undefined,
                fill: isRatio ? false : undefined,
                pointRadius: isRatio ? 3 : undefined,
                pointHoverRadius: isRatio ? 5 : undefined,
                yAxisID: 'y',
              });
            });
          } else {
            // 단일 날짜인 경우 기존 방식 유지
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
          }
        } else {
          // 특정 구역 선택 시: 해당 구역 데이터만 표시
          const selectedRegionData = dataRegions.find(r => r.region_id === targetRegionId);
          if (selectedRegionData && metricData.some(d => d?.[selectedRegionData.region_name] !== undefined)) {
            // 날짜별로 다른 색상 적용 (2개 날짜 선택 시)
            if (dataSelectedDates.length > 1) {
              // 날짜별로 데이터 그룹화
              const dateColors = [
                { bg: 'rgba(24, 144, 255, 0.6)', border: '#1890ff' }, // 첫 번째 날짜: 파란색
                { bg: 'rgba(255, 77, 79, 0.6)', border: '#ff4d4f' }, // 두 번째 날짜: 빨간색
              ];
              
              dataSelectedDates.forEach((date, dateIndex) => {
                const dateStr = date.format('YYYY-MM-DD');
                const dateLabel = `${selectedRegionData.region_name} (${dateStr})`;
                
                // 해당 날짜의 데이터만 필터링하여 labels와 매칭
                const dateData = labels.map((label) => {
                  // chartData에서 해당 시간대와 날짜가 일치하는 항목 찾기
                  const chartItem = dataChartData.find(d => {
                    const timeStr = d.time as string;
                    let itemTimeStr = '';
                    let itemDateStr = '';
                    
                    if (timeStr.includes(' ')) {
                      const parts = timeStr.split(' ');
                      itemDateStr = parts[0];
                      itemTimeStr = parts[1];
                    } else {
                      itemTimeStr = timeStr;
                    }
                    
                    // 시간 비교 (interval에 따라)
                    let matchesTime = false;
                    if (dataSelectedInterval === '1시간') {
                      const hour = itemTimeStr.includes(':') ? itemTimeStr.split(':')[0] : itemTimeStr;
                      matchesTime = hour === label;
                    } else {
                      matchesTime = itemTimeStr === label;
                    }
                    
                    return itemDateStr === dateStr && matchesTime;
                  });
                  
                  if (chartItem) {
                    const itemIndex = dataChartData.indexOf(chartItem);
                    if (itemIndex >= 0 && itemIndex < metricData.length) {
                      return metricData[itemIndex]?.[selectedRegionData.region_name] || 0;
                    }
                  }
                  return 0; // 해당 날짜/시간에 데이터가 없으면 0
                });
                
                datasets.push({
                  type: isRatio ? 'line' as const : 'bar' as const,
                  label: dateLabel,
                  data: dateData,
                  backgroundColor: isRatio ? dateColors[dateIndex].bg.replace('0.6', '0.1') : dateColors[dateIndex].bg,
                  borderColor: dateColors[dateIndex].border,
                  borderWidth: isRatio ? 2 : 1,
                  tension: isRatio ? 0.1 : undefined,
                  fill: isRatio ? false : undefined,
                  pointRadius: isRatio ? 3 : undefined,
                  pointHoverRadius: isRatio ? 5 : undefined,
                  yAxisID: 'y',
                });
              });
            } else {
              // 단일 날짜인 경우 기존 방식 유지
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
      '시간', '구역명', 'CCTV',
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
      const dateStr = selectedDates.length > 0 
        ? selectedDates.map(d => d.format('YYYY-MM-DD')).join('_')
        : '전체';
      link.setAttribute('download', `시간별_혼잡_현황_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>시간</div>,
      dataIndex: 'time',
      key: 'time',
      width: 160,
      fixed: 'left' as const,
      align: 'center' as const,
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
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>평균</div>,
          dataIndex: 'traffic_avg',
          key: 'traffic_avg',
          width: 120,
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_max',
          key: 'traffic_max',
          width: 120,
          align: 'right' as const,
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
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>중</div>,
          dataIndex: 'congestion_level_2',
          key: 'congestion_level_2',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>상</div>,
          dataIndex: 'congestion_level_3',
          key: 'congestion_level_3',
          width: 100,
          align: 'right' as const,
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
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'risk_level_2',
          key: 'risk_level_2',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>경계</div>,
          dataIndex: 'risk_level_3',
          key: 'risk_level_3',
          width: 100,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'risk_level_4',
          key: 'risk_level_4',
          width: 100,
          align: 'right' as const,
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
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#52c41a' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>주의</div>,
          dataIndex: 'congestion_level_molit_2',
          key: 'congestion_level_molit_2',
          width: 130,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#faad14' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>혼잡</div>,
          dataIndex: 'congestion_level_molit_3',
          key: 'congestion_level_molit_3',
          width: 130,
          align: 'right' as const,
          render: (value: number) => (
            <span style={{ color: '#fa8c16' }}>{value?.toLocaleString() || '0'}</span>
          ),
        },
        {
          title: <div style={{ textAlign: 'center' }}>심각</div>,
          dataIndex: 'congestion_level_molit_4',
          key: 'congestion_level_molit_4',
          width: 130,
          align: 'right' as const,
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
      align: 'right' as const,
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
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_in_max',
          key: 'traffic_in_max',
          width: 100,
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_in_sum',
          key: 'traffic_in_sum',
          width: 120,
          align: 'right' as const,
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
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>최대</div>,
          dataIndex: 'traffic_out_max',
          key: 'traffic_out_max',
          width: 100,
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
        {
          title: <div style={{ textAlign: 'center' }}>합계</div>,
          dataIndex: 'traffic_out_sum',
          key: 'traffic_out_sum',
          width: 120,
          align: 'right' as const,
          render: (value: number) => value?.toLocaleString() || '0',
        },
      ],
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>시간별 혼잡 현황</Title>
      </div>

      {/* 검색 조건 */}
      <Card variant="borderless" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text strong>검색일자:</Text>
            <Space wrap>
              <DatePicker
                value={tempDatePickerValue}
                onChange={handleDateAdd}
                format="YYYY-MM-DD"
                placeholder="날짜 선택 (최대 2개)"
                disabledDate={(current) => {
                  // 이미 선택된 날짜는 비활성화
                  return selectedDates.some(d => d.format('YYYY-MM-DD') === current.format('YYYY-MM-DD'));
                }}
              />
              {selectedDates.map((date, index) => (
                <Tag
                  key={date.format('YYYY-MM-DD')}
                  closable
                  onClose={() => handleDateRemove(date)}
                  color="blue"
                  style={{ margin: 0 }}
                >
                  {date.format('YYYY-MM-DD')}
                </Tag>
              ))}
              {selectedDates.length >= 2 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  (최대 2개까지 선택 가능)
                </Text>
              )}
            </Space>
            <Text strong>시간 간격:</Text>
            <Select
              value={selectedInterval}
              onChange={setSelectedInterval}
              style={{ width: 100 }}
            >
              <Select.Option value="5분">5분</Select.Option>
              <Select.Option value="15분">15분</Select.Option>
              <Select.Option value="30분">30분</Select.Option>
              <Select.Option value="1시간">1시간</Select.Option>
            </Select>
            <Text strong>구역:</Text>
            <Select
              value={selectedRegion}
              onChange={setSelectedRegion}
              style={{ width: 170 }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
            style={{ flex: 1 }}
          />
          <Button 
            type="default" 
            icon={<EyeOutlined />}
            onClick={async () => {
              // 현재 선택된 값들을 상세보기 모달 상태로 초기화
              setDetailChartTypeTab(chartTypeTab);
              setDetailSelectedDates([...selectedDates]);
              setDetailSelectedRegion('all'); // 항상 전체로 설정
              setDetailSelectedCCTV('all'); // 항상 전체로 설정
              setDetailSelectedInterval(selectedInterval);
              setGraphDetailModalOpen(true);
              
              // 모달이 열릴 때 데이터 즉시 가져오기
              if (selectedDates.length > 0) {
                // 직접 API 호출하여 데이터 가져오기
                setDetailLoading(true);
                try {
                  const dates = selectedDates.map(d => d.format('YYYY-MM-DD'));
                  const params: any = {
                    dates: dates,
                    interval: selectedInterval,
                  };
                  
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
                  }>('/report/getHourlyStatistics', { params });
                  
                  const chartDataWithKeys = response.chart_data.map((item, index) => ({
                    ...item,
                    key: `detail-chart-${index}`,
                  }));
                  
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
                    
                    const rowAny = row as any;
                    timeGroupedData[time].congestion_level.하 += rowAny.congestion_level_1 || 0;
                    timeGroupedData[time].congestion_level.중 += rowAny.congestion_level_2 || 0;
                    timeGroupedData[time].congestion_level.상 += rowAny.congestion_level_3 || 0;
                    timeGroupedData[time].congestion_level.total += (rowAny.congestion_level_1 || 0) + (rowAny.congestion_level_2 || 0) + (rowAny.congestion_level_3 || 0);
                    
                    timeGroupedData[time].risk_level.관심 += rowAny.risk_level_1 || 0;
                    timeGroupedData[time].risk_level.주의 += rowAny.risk_level_2 || 0;
                    timeGroupedData[time].risk_level.경계 += rowAny.risk_level_3 || 0;
                    timeGroupedData[time].risk_level.심각 += rowAny.risk_level_4 || 0;
                    timeGroupedData[time].risk_level.total += (rowAny.risk_level_1 || 0) + (rowAny.risk_level_2 || 0) + (rowAny.risk_level_3 || 0) + (rowAny.risk_level_4 || 0);
                    
                    timeGroupedData[time].congestion_level_molit_dist.보통 += rowAny.congestion_level_molit_1 || 0;
                    timeGroupedData[time].congestion_level_molit_dist.주의 += rowAny.congestion_level_molit_2 || 0;
                    timeGroupedData[time].congestion_level_molit_dist.혼잡 += rowAny.congestion_level_molit_3 || 0;
                    timeGroupedData[time].congestion_level_molit_dist.심각 += rowAny.congestion_level_molit_4 || 0;
                    timeGroupedData[time].congestion_level_molit_dist.total += (rowAny.congestion_level_molit_1 || 0) + (rowAny.congestion_level_molit_2 || 0) + (rowAny.congestion_level_molit_3 || 0) + (rowAny.congestion_level_molit_4 || 0);
                  });
                  
                  chartDataWithKeys.forEach(item => {
                    const time = item.time;
                    if (timeGroupedData[time]) {
                      const data = timeGroupedData[time];
                      
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
                      item.congestion_level = { 하: 0, 중: 0, 상: 0 };
                      item.risk_level = { 관심: 0, 주의: 0, 경계: 0, 심각: 0 };
                      item.congestion_level_molit_dist = { 보통: 0, 주의: 0, 혼잡: 0, 심각: 0 };
                    }
                  });
                  
                  setDetailChartData(chartDataWithKeys);
                  
                  const cctvCountMap: { [key: string]: number } = {};
                  response.table_data.forEach(row => {
                    const key = `${row.time}_${row.region_name}`;
                    if (row.cctv_name && row.cctv_name !== '-' && row.cctv_name !== '전체') {
                      if (!cctvCountMap[key]) {
                        cctvCountMap[key] = 0;
                      }
                      cctvCountMap[key] += 1;
                    }
                  });
                  
                  const tableDataWithKeys = response.table_data.map((item, index) => {
                    const key = `${item.time}_${item.region_name}`;
                    const cctvCount = cctvCountMap[key] || 0;
                    
                    let cctvDisplay = item.cctv_name;
                    if (item.cctv_name === '-' || item.cctv_name === '전체' || !item.cctv_name) {
                      cctvDisplay = cctvCount > 0 ? `${cctvCount}개` : '-';
                    }
                    
                    return {
                      ...item,
                      key: `detail-table-${index}`,
                      cctv_name: cctvDisplay,
                      cctv_count: cctvCount,
                    };
                  });
                  setDetailTableData(tableDataWithKeys);
                  
                  // 디버깅: 데이터 확인
                  console.log('Detail Chart Data:', chartDataWithKeys.length, chartDataWithKeys.slice(0, 3));
                  console.log('Detail Table Data:', tableDataWithKeys.length, tableDataWithKeys.slice(0, 3));
                  const uniqueRegions = Array.from(new Set(tableDataWithKeys.map(r => r.region_name)));
                  console.log('Unique Regions in Detail Table Data:', uniqueRegions);
                } catch (error) {
                  console.error('Failed to fetch detail statistics:', error);
                  setDetailChartData([]);
                  setDetailTableData([]);
                } finally {
                  setDetailLoading(false);
                }
              }
            }}
            style={{ marginLeft: '16px' }}
          >
            그래프 상세보기
          </Button>
        </div>
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
            <Text type="secondary" style={{ fontSize: '12px' }}>* 15초간 데이터의 {selectedInterval} 통계</Text>
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
            size="middle"
          />
        </div>
      </Card>

      {/* 그래프 상세보기 Modal */}
      <Modal
        title="그래프 상세보기"
        open={graphDetailModalOpen}
        onCancel={() => setGraphDetailModalOpen(false)}
        footer={null}
        width="95%"
        style={{ top: 20, maxWidth: '1800px' }}
      >
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          {/* 조건 선택 UI */}
          <Card variant="borderless" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* 탭 */}
              <div style={{ flex: 1 }}>
                <Tabs
                  activeKey={detailChartTypeTab}
                  onChange={setDetailChartTypeTab}
                  items={[
                    { key: 'traffic', label: 'Traffic' },
                    { key: 'congestion_ratio', label: '혼잡비율' },
                    { key: 'congestion_ratio_molit', label: '혼잡비율(국토부)' },
                    { key: 'congestion_level', label: '혼잡도' },
                    { key: 'risk_level', label: '혼잡지속도' },
                    { key: 'congestion_level_molit_dist', label: '혼잡도(국토부)' },
                  ]}
                />
              </div>
              
              {/* 조회조건 표기 */}
              <div style={{ marginLeft: '24px', padding: '8px 16px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                <Text>
                  <Text strong>조회일자: </Text>
                  {selectedDates.map((date, index) => (
                    <Text key={index}>
                      {date.format('YYYY-MM-DD')}
                      {index < selectedDates.length - 1 && ', '}
                    </Text>
                  ))}
                  {' | '}
                  <Text strong>시간 간격: </Text>
                  <Text>{selectedInterval}</Text>
                </Text>
              </div>
            </div>
          </Card>

          {/* 전체 + 구역별 그래프 그리드 (1행에 3개씩) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px' 
          }}>
            {detailLoading ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* 전체 그래프 */}
                <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', padding: '8px' }}>
                  <Title level={5} style={{ marginBottom: '6px', textAlign: 'center', fontSize: '14px' }}>전체</Title>
                  <div style={{ height: '200px', position: 'relative' }}>
                    {detailChartData.length > 0 ? (
                      <Chart 
                        type="bar" 
                        data={getChartData(detailChartTypeTab, undefined, detailChartData, detailTableData, selectedDates, selectedInterval, 'all', 'all', [], regions)} 
                        options={{
                          ...getChartOptions(detailChartTypeTab, selectedInterval),
                          maintainAspectRatio: false,
                          plugins: {
                            ...getChartOptions(detailChartTypeTab, selectedInterval).plugins,
                            legend: {
                              display: false,
                            },
                          },
                        }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Text type="secondary">데이터가 없습니다.</Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* 구역별 그래프 */}
                {regions.map(region => (
                  <div key={region.region_id} style={{ border: '1px solid #f0f0f0', borderRadius: '4px', padding: '8px' }}>
                    <Title level={5} style={{ marginBottom: '6px', textAlign: 'center', fontSize: '14px' }}>
                      {region.region_name}
                    </Title>
                    <div style={{ height: '200px', position: 'relative' }}>
                      {detailChartData.length > 0 ? (
                        <Chart 
                          type="bar" 
                          data={getChartData(detailChartTypeTab, region.region_id, detailChartData, detailTableData, selectedDates, selectedInterval, 'all', 'all', [], regions)} 
                          options={{
                            ...getChartOptions(detailChartTypeTab, selectedInterval, true),
                            maintainAspectRatio: false,
                            plugins: {
                              ...getChartOptions(detailChartTypeTab, selectedInterval, true).plugins,
                              legend: {
                                display: false,
                              },
                            },
                          }} 
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Text type="secondary">데이터가 없습니다.</Text>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

