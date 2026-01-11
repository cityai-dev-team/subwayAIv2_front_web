import { useEffect, useState, useCallback } from 'react';
import { Card } from '../../components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DashboardTimeTrend() {
  const [trendData, setTrendData] = useState<Array<{ time: string; avgCongestion: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [avgCongestionRatio, setAvgCongestionRatio] = useState(0);
  
  // 기간 조건
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [selectedSpace, setSelectedSpace] = useState<string>('0');

  // 대시보드 데이터 가져오기
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 기간 조건을 사용하여 데이터 조회
      const dateTime = `${selectedDate}T${selectedTime}:00`;
      const startTime = new Date(dateTime);
      
      // 10분간의 데이터 조회 (15초 간격)
      const dataPoints = [];
      for (let i = 0; i < 40; i++) { // 10분 = 600초 / 15초 = 40개
        const time = new Date(startTime.getTime() + i * 15 * 1000);
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        const seconds = String(time.getSeconds()).padStart(2, '0');
        
        // TODO: 실제 API 호출로 데이터 가져오기
        // 현재는 시뮬레이션 데이터
        const value = Math.max(0, Math.min(200, 30 + (Math.random() * 40 - 20)));
        
        dataPoints.push({
          time: `${hours}:${minutes}:${seconds}`,
          avgCongestion: Math.round(value * 10) / 10
        });
      }
      
      setTrendData(dataPoints);
      
      // 평균 혼잡도 계산
      const avg = dataPoints.length > 0
        ? dataPoints.reduce((sum, d) => sum + d.avgCongestion, 0) / dataPoints.length
        : 0;
      setAvgCongestionRatio(Math.round(avg * 10) / 10);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedTime, selectedSpace]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSearch = () => {
    fetchDashboardData();
  };

  if (loading && trendData.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold">시간대별 현황</h1>
        <Card className="p-8 text-center">
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시간대별 현황</h1>
          <p className="text-sm text-gray-500 mt-1">
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 검색 조건 */}
      <Card className="p-4 bg-white border-2 border-gray-200 shadow-md">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              공간
            </label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">0. 전체(전체 공간 평균)</option>
              {/* TODO: 실제 공간 목록 가져오기 */}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              측정 시작 일시
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              검색
            </button>
          </div>
        </div>
      </Card>

      {/* 시간대별 추이 차트 */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">15초 단위 혼잡도 통계 분석 (V2)</h2>
        <p className="text-sm text-gray-600 mb-4">
          측정 시작 일시부터 10분간의 15초 간격 혼잡도를 나타내는 그래프 (국토교통부 방식)
        </p>
        <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
          {trendData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-gray-500">데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  label={{ value: '혼잡비율 (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                  domain={[0, 200]}
                  ticks={[0, 40, 80, 120, 160, 200]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value}%`, '혼잡비율']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCongestion" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="혼잡비율"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border-2 border-gray-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2">현재 평균 혼잡비율</div>
          <div className="text-3xl font-bold text-gray-900">{avgCongestionRatio.toFixed(1)}%</div>
        </Card>
        <Card className="p-6 bg-white border-2 border-gray-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2">최고 혼잡비율</div>
          <div className="text-3xl font-bold text-gray-900">
            {trendData.length > 0 ? Math.max(...trendData.map(d => d.avgCongestion)).toFixed(1) : 0}%
          </div>
        </Card>
        <Card className="p-6 bg-white border-2 border-gray-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2">최저 혼잡비율</div>
          <div className="text-3xl font-bold text-gray-900">
            {trendData.length > 0 ? Math.min(...trendData.map(d => d.avgCongestion)).toFixed(1) : 0}%
          </div>
        </Card>
      </div>
    </div>
  );
}
