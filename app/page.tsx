"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (token && userData) {
      const user = JSON.parse(userData)
      
      // Route based on user role
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/vendor/dashboard")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-lg text-slate-700">Redirecting to your dashboard...</div>
      </div>
    </div>
  )
}
