import { Button } from "@/components/ui/button"
import { Link2, Check } from "lucide-react"

interface ShareButtonProps {
  copied: boolean
  onShare: () => void
}

export function ShareButton({ copied, onShare }: ShareButtonProps) {
  return (
    <div className="flex justify-center pt-2 pb-4">
      <Button
        onClick={onShare}
        className={`w-full max-w-sm gap-2 transition-all duration-200 ${
          copied
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-slate-800 hover:bg-slate-900"
        }`}
        size="lg"
      >
        {copied ? (
          <>
            <Check className="h-5 w-5" />
            링크가 복사되었습니다!
          </>
        ) : (
          <>
            <Link2 className="h-5 w-5" />
            공유 링크 복사
          </>
        )}
      </Button>
    </div>
  )
}
