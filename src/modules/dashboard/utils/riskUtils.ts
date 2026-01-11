/**
 * 위험도 판정 기준 (사당, 신도림 방식)
 * 혼잡지속도(밀집도+지속시간) 지표에 따른 위험도 판정
 * 
 * <표 2-12> 최종 혼잡지속도(밀집도+지속시간) 지표
 * - 관심: -
 * - 주의: '중' 이상이 연속 3회 이상
 * - 경계: '중' 이상이 연속 5회 또는 '상'이 연속 3회 이상
 * - 심각: '상'이 연속 5회
 * 
 * 여기서 '중' = 주의 이상 (주의, 혼잡, 심각)
 *      '상' = 혼잡 이상 (혼잡, 심각)
 */

// 위험도별 색상 매핑
export const getRiskColor = (riskLevel: string): string => {
  const colorMap: Record<string, string> = {
    '심각': '#F5222D',
    '경계': '#FA8C16',
    '주의': '#FAAD14',
    '관심': '#52C41A',
    'level-4': '#F5222D',
    'level-3': '#FA8C16',
    'level-2': '#FAAD14',
    'level-1': '#52C41A',
  };
  return colorMap[riskLevel] || '#D9D9D9';
};

// 위험도 레벨 변환 (level-X → 한글)
export const getRiskLevelText = (level: string): string => {
  const levelMap: Record<string, string> = {
    'level-4': '심각',
    'level-3': '경계',
    'level-2': '주의',
    'level-1': '관심',
  };
  return levelMap[level] || level;
};

