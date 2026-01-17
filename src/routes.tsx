/**
 * 라우터 모듈
 * SubwayAIv2 Front Web의 라우팅을 정의합니다.
 * api_dt 구조를 참고하여 명확하게 정리되었습니다.
 */
import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// ===== 모니터링 모듈 =====
const DashboardHome = lazy(() => import('./modules/dashboard/DashboardHome'));
const CCTVMonitoring = lazy(() => import('./modules/dashboard/CCTVMonitoring'));
const TimeTrendMonitoring = lazy(() => import('./modules/dashboard/TimeTrendMonitoring'));

// ===== 통계 모듈 =====
const HourlyStatistics = lazy(() => import('./modules/statistics/HourlyStatistics'));
const DailyStatistics = lazy(() => import('./modules/statistics/DailyStatistics'));
const MonthlyStatistics = lazy(() => import('./modules/statistics/MonthlyStatistics'));

// ===== 관리 모듈 =====
const CCTVManagement = lazy(() => import('./modules/management/CCTVManagement'));
const DataManagement = lazy(() => import('./modules/management/DataManagement'));

// ===== 공통 컴포넌트 =====
const NotFound = lazy(() => import('./components/layout/NotFound'));

// ===== 로딩 컴포넌트 =====
const PageLoader = () => (
  <div style={{ 
    padding: '24px', 
    minHeight: '200px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <div className="text-sm opacity-60">로딩 중...</div>
  </div>
);

/**
 * 애플리케이션 라우터
 * 
 * 라우트 구조:
 * - 모니터링: /, /dashboard/cctv-monitoring, /dashboard/time-trend
 * - 통계: /statistics/hourly, /statistics/daily, /statistics/monthly
 * - 관리: /management/cctv-management
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* 모니터링 라우트 */}
        <Route 
          index 
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardHome />
            </Suspense>
          } 
        />
        <Route 
          path="dashboard/cctv-monitoring" 
          element={
            <Suspense fallback={<PageLoader />}>
              <CCTVMonitoring />
            </Suspense>
          } 
        />
        <Route 
          path="dashboard/time-trend" 
          element={
            <Suspense fallback={<PageLoader />}>
              <TimeTrendMonitoring />
            </Suspense>
          } 
        />
          
        {/* 통계 라우트 */}
        <Route 
          path="statistics/hourly" 
          element={
            <Suspense fallback={<PageLoader />}>
              <HourlyStatistics />
            </Suspense>
          } 
        />
        <Route 
          path="statistics/daily" 
          element={
            <Suspense fallback={<PageLoader />}>
              <DailyStatistics />
            </Suspense>
          } 
        />
        <Route 
          path="statistics/monthly" 
          element={
            <Suspense fallback={<PageLoader />}>
              <MonthlyStatistics />
            </Suspense>
          } 
        />
        
        {/* 관리 라우트 */}
        <Route 
          path="management/cctv-management" 
          element={
            <Suspense fallback={<PageLoader />}>
              <CCTVManagement />
            </Suspense>
          } 
        />
        <Route 
          path="management/data-management" 
          element={
            <Suspense fallback={<PageLoader />}>
              <DataManagement />
            </Suspense>
          } 
        />
      </Route>
      
      {/* 404 Not Found */}
      <Route 
        path="*" 
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        } 
      />
    </Routes>
  );
}
