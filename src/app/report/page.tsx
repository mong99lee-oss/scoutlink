import Link from "next/link";

export default function ReportPage() {
  return (
    <main className="stack">
      <h1>리포트</h1>
      <p>현재는 홈에서 생성한 공유 링크가 리포트를 표시합니다.</p>
      <Link href="/">홈으로 돌아가기</Link>
    </main>
  );
}
