import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout title="Create Account">
      <div className="p-8">
        <RegisterForm redirectTo="/dashboard" />
      </div>
    </AuthLayout>
  )
}
