import { cn } from '@gentleduck/libs/cn'
import Image from 'next/image'
import Link from 'next/link'

export function Logo({ className, href = '/', ...props }: Partial<React.ComponentProps<typeof Link>>) {
  return (
    <Link className={cn('flex items-center gap-2 font-medium', className)} href={href} {...props}>
      <Image alt="Image" className="h-[38px] w-[40px] object-contain" height={200} src="/acme.svg" width={200} />
    </Link>
  )
}
