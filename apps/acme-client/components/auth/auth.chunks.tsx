import { Input } from '@acme/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import React from 'react'

export function PasswordInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="relative">
      <Input
        className="pr-10"
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="••••••••••••"
        type={showPassword ? 'text' : 'password'}
        value={value}
      />
      <button
        className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        type="button">
        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
}

//   <div className="grid gap-2">
//             <div className="flex items-center justify-between">
//               <FormLabel>Password</FormLabel>
//               <Link href="/auth/forgot-password" className="text-sm underline-offset-4 hover:underline">
//                 Forgot your password?
//               </Link>
//             </div>
// ///
//
//   </div>
