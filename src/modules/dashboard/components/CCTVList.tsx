import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import type { CCTVItem } from '../types';
import { getRiskColor, getRiskLevelText } from '../utils/riskUtils';
import { getCongestionColor } from '../utils/congestionUtils';

interface CCTVListProps {
  cctvList: CCTVItem[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onCCTVSelect?: (cctvId: string) => void;
}

export default function CCTVList({ cctvList, viewMode, onViewModeChange, onCCTVSelect }: CCTVListProps) {
  // 데이터가 없어도 빈 목록으로 표시 (로딩 메시지 제거)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">CCTV 목록</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            그리드뷰
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            테이블뷰
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cctvList.map((cctv) => {
            // 국토교통부 혼잡도 레벨 - API에서 받은 데이터를 그대로 사용 (계산하지 않음)
            const congestionLevel = cctv.congestion_level || '보통';
            const congestionColor = getCongestionColor(congestionLevel);
            const congestionRatio = Math.min(200, Math.max(0, cctv.congestion_ratio));
            
            return (
              <Card
                key={cctv.cctv_uid}
                className="p-6 bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => onCCTVSelect?.(cctv.cctv_id)}
              >
                {/* 제목과 혼잡도 상태 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{cctv.cctv_id}</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: congestionColor }}
                    ></div>
                    <span className="text-sm font-medium" style={{ color: congestionColor }}>
                      {congestionLevel}
                    </span>
                  </div>
                </div>
                
                {/* CCTV 이름 */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-1">{cctv.cctv_kr_name}</p>
                
                {/* 큰 퍼센트 값 */}
                <div className="mb-4">
                  <div className="text-5xl font-bold text-white mb-1">
                    {cctv.congestion_ratio.toFixed(1)}%
                  </div>
                  {cctv.congestion_ratio > 0 && (
                    <div className="text-xs text-gray-400">↓</div>
                  )}
                </div>
                
                {/* 게이지 바 */}
                <div className="mb-2">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (congestionRatio / 200) * 100)}%`,
                        backgroundColor: congestionColor
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* 스케일 */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>40%</span>
                  <span>80%</span>
                  <span>120%</span>
                  <span>160%</span>
                  <span>200%</span>
                </div>
                
                {/* 통행량 및 혼잡지속도 */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-gray-400">통행량</div>
                      <div className="text-sm font-semibold text-white">{cctv.traffic}명</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">혼잡지속도</div>
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: getRiskColor(cctv.risk_level), color: 'white' }}
                      >
                        {getRiskLevelText(cctv.risk_level)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">CCTV ID</th>
                  <th className="text-left p-2">CCTV 명</th>
                  <th className="text-left p-2">구역</th>
                  <th className="text-right p-2">혼잡비율</th>
                  <th className="text-center p-2">혼잡도</th>
                  <th className="text-center p-2">혼잡지속도</th>
                  <th className="text-right p-2">통행량</th>
                </tr>
              </thead>
              <tbody>
                {cctvList.map((cctv) => {
                  const congestionLevel = cctv.congestion_level || getCongestionLevel(cctv.congestion_ratio);
                  const congestionColor = getCongestionColor(congestionLevel);
                  
                  return (
                    <tr 
                      key={cctv.cctv_uid} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => onCCTVSelect?.(cctv.cctv_id)}
                    >
                      <td className="p-2">
                        <Badge style={{ backgroundColor: getRiskColor(cctv.risk_level), color: 'white' }}>
                          {cctv.cctv_id}
                        </Badge>
                      </td>
                      <td className="p-2">{cctv.cctv_kr_name}</td>
                      <td className="p-2">{cctv.region_name}</td>
                      <td className="p-2 text-right">{cctv.congestion_ratio.toFixed(1)}%</td>
                      <td className="p-2 text-center">
                        <Badge style={{ backgroundColor: congestionColor, color: 'white' }}>
                          {congestionLevel}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge style={{ backgroundColor: getRiskColor(cctv.risk_level), color: 'white' }}>
                          {getRiskLevelText(cctv.risk_level)}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{cctv.traffic}명</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
