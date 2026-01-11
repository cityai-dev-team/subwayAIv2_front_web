// API 응답 타입
export interface DashboardData {
  stations: Record<string, {
    region_id: string | null;
    region_name?: string | null;
    region_summary_id: number;
    cctv_count: number;
    risk_distribution?: {
      심각: number;
      경계: number;
      주의: number;
      관심: number;
    };
    congestion_distribution?: {
      보통: number;
      주의: number;
      혼잡: number;
      심각: number;
    };
  }>;
}

export interface OverviewStats {
  totalCCTVs: number;
  activeCCTVs: number;
  riskSummary: {
    심각: { count: number; items: string[] };
    경계: { count: number; items: string[] };
    주의: { count: number; items: string[] };
    관심: { count: number; items: string[] };
  };
    congestionSummary: {
      보통: { count: number; items: string[] };
      주의: { count: number; items: string[] };
      혼잡: { count: number; items: string[] };
      심각: { count: number; items: string[] };
    };
  avgCongestionRatio: number;
}

export interface RegionSummary {
  region_id: string;
  region_name: string;
  avg_congestion_ratio: number;
  congestion_level_molit?: string; // 혼잡도 레벨 (국토교통부 기준: 보통/주의/혼잡/심각)
  cctv_count: number;
  risk_level: string;
  risk_distribution: {
    심각: number;
    경계: number;
    주의: number;
    관심: number;
  };
}

export interface CCTVItem {
  cctv_uid: number;
  cctv_id: string;
  cctv_kr_name: string;
  region_name: string;
  congestion_ratio: number;
  congestion_level?: string; // 국토교통부 혼잡도 레벨 (보통, 주의, 혼잡, 심각)
  risk_level: string; // 위험도 레벨 (level-1~4 또는 관심, 주의, 경계, 심각)
  traffic: number;
}

export interface CCTVListResponse {
  congestion_list: Array<{
    cctv_uid: number;
    cctv_id: string;
    cctv_kr_name: string;
    region_id?: string;
    region_name?: string;
    region_summary_id?: number;
    congestion_level: number;
    congestion_percentage: number;
    traffic_in: number;
    traffic_out: number;
    traffic: number;
    risk_level: string;
  }>;
  level_count: Record<string, number>;
}

