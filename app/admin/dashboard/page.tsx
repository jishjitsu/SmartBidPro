"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getAdminStats, getMockBidders, BidData } from "@/lib/mockData"
import { BarChart3, TrendingUp, Users, Award, Eye, Edit, Trash2 } from "lucide-react"

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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTender, setSelectedTender] = useState<string | null>(null)
  const [bidders, setBidders] = useState<BidData[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/vendor/dashboard")
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
      setAuctions(data)
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

  const handleViewBids = (tenderId: string) => {
    setSelectedTender(tenderId)
    setBidders(getMockBidders(tenderId, Math.floor(Math.random() * 5) + 3))
  }

  const stats = getAdminStats(auctions)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-48 bg-slate-800" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-4 mb-12">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 bg-slate-800" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-40 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                SmartBid PRO - Admin Control Center
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Welcome, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                {user?.role?.toUpperCase()}
              </Badge>
              <Button 
                onClick={() => router.push("/admin/create-tender")} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Tender
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
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
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Total Tenders Created</CardDescription>
              <CardTitle className="text-4xl text-white">
                {stats.totalTenders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-emerald-500 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Active Bids</CardDescription>
              <CardTitle className="text-4xl text-white">
                {stats.activeBids}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Users className="h-4 w-4" />
                <span>Across all tenders</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Avg. Compliance Score</CardDescription>
              <CardTitle className="text-4xl text-white">
                {stats.avgComplianceScore}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.avgComplianceScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Tenders Awarded</CardDescription>
              <CardTitle className="text-4xl text-white">
                {stats.tendersAwarded}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Award className="h-4 w-4" />
                <span>Completed successfully</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12 bg-slate-800" />

        {/* Tenders Management */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Tender Management</h2>
        </div>

        {auctions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-16">
              <div className="text-center text-slate-400">
                <p className="text-base">No tenders created yet</p>
                <p className="text-sm mt-2">Create your first tender to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {auctions.map((auction) => (
              <Card key={auction.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg text-white">{auction.title}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={
                            auction.status === "Open" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-slate-700/50 text-slate-400 border-slate-600"
                          }
                        >
                          {auction.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400">
                        {auction.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={() => handleViewBids(auction.id!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Bids
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-slate-500">Minimum Bid</span>
                      <p className="font-semibold text-white mt-1">
                        ${auction.minimum_bid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Start Date</span>
                      <p className="text-slate-300 mt-1">
                        {new Date(auction.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">End Date</span>
                      <p className="text-slate-300 mt-1">
                        {new Date(auction.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Bidders Table */}
                  {selectedTender === auction.id && bidders.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <h4 className="font-semibold text-white mb-4">Active Bidders</h4>
                      <div className="space-y-3">
                        {bidders.map((bidder) => (
                          <div 
                            key={bidder.id} 
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-white">{bidder.bidder_company}</p>
                              <p className="text-sm text-slate-400">{bidder.bidder_name}</p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm text-slate-500">Bid Amount</p>
                                <p className="font-semibold text-white">
                                  ${bidder.bid_amount.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">Compliance</p>
                                <p className={`font-semibold ${
                                  bidder.compliance_score >= 85 ? 'text-emerald-400' :
                                  bidder.compliance_score >= 70 ? 'text-amber-400' :
                                  'text-red-400'
                                }`}>
                                  {bidder.compliance_score}%
                                </p>
                              </div>
                              <Badge 
                                variant="outline"
                                className={
                                  bidder.risk_level === "Low" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                    : bidder.risk_level === "Medium"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
                                }
                              >
                                {bidder.risk_level} Risk
                              </Badge>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Award
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
