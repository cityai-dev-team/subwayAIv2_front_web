import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-center space-y-3">
        <div className="text-2xl font-semibold">404</div>
        <div className="opacity-70">페이지를 찾을 수 없습니다.</div>
        <Link to="/" className="underline">Go Home</Link>
      </div>
    </div>
  );
}
