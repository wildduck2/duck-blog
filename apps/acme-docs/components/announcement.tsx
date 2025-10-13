import { Badge } from '@acme/ui/badge'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

export function Announcement() {
  return (
    <Badge asChild className="mx-auto rounded-full" variant="secondary">
      <Link href="/docs/components">
        Introducing New Version of Components <span className="underline">V3</span>
        <ArrowRightIcon />
      </Link>
    </Badge>
  )
}
