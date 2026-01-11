type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, pageSize, total, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pages, page + 1));

  return (
    <div className="flex items-center justify-end gap-2">
      <button className="border rounded px-2 h-9" onClick={prev} disabled={page <= 1}>
        이전
      </button>
      <span className="text-sm">
        {page} / {pages}
      </span>
      <button className="border rounded px-2 h-9" onClick={next} disabled={page >= pages}>
        다음
      </button>
    </div>
  );
}
