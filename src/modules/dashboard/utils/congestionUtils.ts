// 국토교통부 방식 혼잡도 레벨 계산
// 기준: 130% 이하(보통), 130~150%(주의), 150~170%(혼잡), 170% 이상(심각)
export const getCongestionLevel = (congestionPercentage: number): string => {
  if (congestionPercentage <= 130) {
    return '보통';
  } else if (congestionPercentage <= 150) {
    return '주의';
  } else if (congestionPercentage <= 170) {
    return '혼잡';
  } else {
    return '심각';
  }
};

// 혼잡도 레벨에 따른 색상
export const getCongestionColor = (level: string): string => {
  const colorMap: Record<string, string> = {
    '보통': '#52C41A', // 초록
    '주의': '#FAAD14', // 노랑
    '혼잡': '#FA8C16', // 주황
    '심각': '#F5222D', // 빨강
  };
  return colorMap[level] || '#52C41A';
};

