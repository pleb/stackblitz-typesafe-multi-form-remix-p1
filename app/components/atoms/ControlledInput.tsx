import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react'
import { cn } from '~/utilities/cn'

export type ButtonProps = {
  children?: ReactNode
  value?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value'>

export const ControlledInput = forwardRef<HTMLInputElement, ButtonProps>(
  ({ children, value, className, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(value ?? '')
    return (
      <input
        ref={ref}
        className={cn('w-full', 'rounded-md', 'text-black', className)}
        value={inputValue}
        onChange={e => setInputValue(e.currentTarget.value)}
        {...props}
      >
        {children}
      </input>
    )
  },
)
ControlledInput.displayName = 'ControlledInput'
