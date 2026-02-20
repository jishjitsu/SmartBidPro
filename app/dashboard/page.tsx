"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    
    // Route based on role
    if (parsedUser.role === "admin") {
      router.push("/admin/dashboard")
    } else if (parsedUser.role === "vendor") {
      router.push("/vendor/dashboard")
    } else {
      router.push("/vendor/dashboard") // Default fallback
    }
  }, [router])

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>
}
