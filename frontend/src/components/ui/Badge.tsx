import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva('ui-badge', {
  variants: {
    tone: {
      neutral: 'ui-badge--neutral',
      info: 'ui-badge--info',
      success: 'ui-badge--success',
      danger: 'ui-badge--danger',
      warning: 'ui-badge--warning',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
