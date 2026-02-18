"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getVendorStats } from "@/lib/mockData"
import { Search, Filter, TrendingUp, Target, Award, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Auction {
  id: string
  title: string
  description: string
  status: string
  created_by: string
  start_date: string
  end_date: string
  minimum_bid: number
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === "admin") {
      router.push("/admin/dashboard")
      return
    }

    setUser(parsedUser)
    fetchAuctions(token)
  }, [router])

  const fetchAuctions = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auctions", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch auctions")
      }

      const data = await response.json()
      setAuctions(data.filter((a: Auction) => a.status === "Open"))
    } catch (error) {
      console.error("Error fetching auctions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleApplyTender = (tenderId: string) => {
    router.push(`/vendor/apply/${tenderId}`)
  }

  const stats = getVendorStats()

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          auction.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-4 mb-12">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-emerald-600" />
                SmartBid PRO - Tender Marketplace
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Welcome, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Button 
                variant="outline"
                onClick={() => router.push("/vendor/my-bids")} 
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                <Clock className="h-4 w-4 mr-2" />
                My Applications
              </Button>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                {user?.role?.toUpperCase() || 'VENDOR'}
              </Badge>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4 mb-12">
          <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600">Active Bids</CardDescription>
              <CardTitle className="text-4xl text-emerald-700">
                {stats.activeBids}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <Clock className="h-4 w-4" />
                <span>Awaiting results</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600">Contracts Won</CardDescription>
              <CardTitle className="text-4xl text-emerald-700">
                {stats.wonBids}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <Award className="h-4 w-4" />
                <span>Successfully awarded</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600">Win Rate</CardDescription>
              <CardTitle className="text-4xl text-emerald-700">
                {stats.winRate}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${stats.winRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-600">Avg. Compliance</CardDescription>
              <CardTitle className="text-4xl text-emerald-700">
                {stats.avgComplianceScore}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Strong performance</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Available Tenders</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tenders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Tenders Grid */}
        {filteredAuctions.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-16">
              <div className="text-center text-slate-500">
                <p className="text-base">No open tenders available</p>
                <p className="text-sm mt-2">Check back later for new opportunities</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map((auction) => {
              const daysRemaining = Math.ceil(
                (new Date(auction.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              
              return (
                <Card 
                  key={auction.id} 
                  className="bg-white border-emerald-100 hover:shadow-lg transition-all hover:border-emerald-300 group"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {auction.title}
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Open
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-600 line-clamp-2">
                      {auction.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 px-3 bg-emerald-50 rounded-lg">
                        <span className="text-slate-700 font-medium">Minimum Bid</span>
                        <span className="font-bold text-emerald-700">
                          ${auction.minimum_bid.toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-slate-600">Deadline</span>
                        <span className="text-slate-900 font-medium">
                          {new Date(auction.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {daysRemaining && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-700 font-medium">
                            {daysRemaining} days remaining
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApplyTender(auction.id!)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
