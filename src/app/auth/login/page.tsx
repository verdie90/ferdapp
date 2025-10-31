import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="p-8">
        <LoginForm redirectTo="/dashboard" />
      </div>
    </AuthLayout>
  )
}
