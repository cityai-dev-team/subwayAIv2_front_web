import { Card } from '../../../components/ui/card';
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
import type { CCTVItem } from '../types';

interface TimeTrendChartProps {
  trendData: Array<{ time: string; avgCongestion: number }>;
  cctvList: CCTVItem[];
  selectedCCTV: string;
  onCCTVChange: (cctvId: string) => void;
}

export default function TimeTrendChart({ trendData, cctvList, selectedCCTV, onCCTVChange }: TimeTrendChartProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">시간대별 현황</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedCCTV}
            onChange={(e) => onCCTVChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체</option>
            {cctvList.map((cctv) => (
              <option key={cctv.cctv_uid} value={cctv.cctv_id}>
                {cctv.cctv_id} - {cctv.cctv_kr_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
        {trendData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">데이터가 없습니다.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                label={{ value: '혼잡비율 (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                domain={[0, 100]}
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
                name="평균 혼잡비율"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

