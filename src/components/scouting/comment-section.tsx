import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

interface CommentSectionProps {
  comment: string
}

export function CommentSection({ comment }: CommentSectionProps) {
  return (
    <Card className="bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-slate-800">종합 코멘트</h2>
      </div>
      <p className="break-words leading-relaxed text-slate-600">{comment}</p>
    </Card>
  )
}
