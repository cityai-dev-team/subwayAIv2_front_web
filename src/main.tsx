import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import { AuthProvider } from './modules/auth/AuthContext';
import { ToastProvider } from './components/ui/use-toast';
import { Toaster } from './components/ui/toaster';
import AppRoutes from './routes';
import './styles/index.css';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={koKR}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
            fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          },
        }}
      >
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
