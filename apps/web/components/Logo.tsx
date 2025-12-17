import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 32, height = 32, className = "" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={width}
        height={height}
        className="flex-shrink-0"
        priority
      />
      <span className="font-bold whitespace-nowrap text-base tracking-tight">
        <span className="text-green-600 dark:text-green-500">Market</span>
        <span className="text-red-600 dark:text-red-500">Pulse</span>
      </span>
    </div>
  )
}
