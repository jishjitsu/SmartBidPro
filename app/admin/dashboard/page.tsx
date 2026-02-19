"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getAdminStats, getMockBidders, getActivityFeed, BidData, ActivityItem } from "@/lib/mockData"
import {
  BarChart3, TrendingUp, Users, Award, Eye, Edit, Trash2,
  Activity, DollarSign, UserPlus, AlertTriangle, CheckCircle2,
  Clock, ShieldAlert, Zap, FileText, Bell,
} from "lucide-react"

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
  const [activityFeed] = useState<ActivityItem[]>(getActivityFeed())

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

  // ─── Activity Feed Icon Helper ───────────────────────────────────────────
  const ActivityIcon = ({ item }: { item: ActivityItem }) => {
    if (item.type === "bid") return <FileText className="h-3.5 w-3.5" />
    if (item.type === "registration") return <UserPlus className="h-3.5 w-3.5" />
    if (item.type === "award") return <Award className="h-3.5 w-3.5" />
    if (item.type === "compliance") return <ShieldAlert className="h-3.5 w-3.5" />
    return <Bell className="h-3.5 w-3.5" />
  }

  const activityColors: Record<ActivityItem["severity"], string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  }

  const timeAgo = (iso: string) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (diff < 60) return `${diff}m ago`
    return `${Math.round(diff / 60)}h ago`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-40 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  SmartBid PRO
                  <span className="ml-2 text-sm font-normal text-slate-400">· Admin Control Center</span>
                </h1>
                <p className="text-xs text-slate-500">Welcome, {user?.name || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* System Health Pill */}
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
              <Button
                onClick={() => router.push("/admin/create-tender")}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs"
                size="sm"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Create Tender
              </Button>
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                Admin
              </span>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Tenders</CardDescription>
              <CardTitle className="text-5xl font-black text-white leading-none mt-1">{stats.totalTenders}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <TrendingUp className="h-3.5 w-3.5" /><span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Tender Value</CardDescription>
              <CardTitle className="text-4xl font-black text-white leading-none mt-1">
                {stats.totalValue > 0
                  ? `$${(stats.totalValue / 1000).toFixed(0)}k`
                  : <span className="text-2xl text-slate-500">No data</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs">
                <DollarSign className="h-3.5 w-3.5" /><span>Across all open tenders</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Compliance Score</CardDescription>
              <CardTitle className="text-5xl font-black text-white leading-none mt-1">{stats.avgComplianceScore}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Progress value={stats.avgComplianceScore} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
              <p className="text-xs text-slate-500">Platform-wide vendor quality</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">User Growth</CardDescription>
              <CardTitle className="text-5xl font-black text-white leading-none mt-1">+{stats.userGrowth}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <Users className="h-3.5 w-3.5" /><span>New vendors this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8 bg-slate-800" />

        {/* Two-column: Tender Management + Activity Feed */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* Left — Tender Management */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Tender Management</h2>
              <span className="text-xs text-slate-500">{auctions.length} total</span>
            </div>

            {auctions.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="py-16 text-center text-slate-400">
                  <p className="text-base font-medium">No tenders created yet</p>
                  <p className="text-sm mt-2 text-slate-500">Create your first tender to get started</p>
                  <Button
                    onClick={() => router.push("/admin/create-tender")}
                    className="mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs"
                    size="sm"
                  >
                    Create First Tender
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {auctions.map((auction) => (
                  <Card key={auction.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <CardTitle className="text-base font-semibold text-white truncate">{auction.title}</CardTitle>
                            <span
                              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                auction.status === "Open"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : auction.status === "Awarded"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-slate-700/50 text-slate-400 border-slate-600"
                              }`}
                            >
                              {auction.status === "Awarded" ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Awarded</>
                              ) : auction.status === "Open" ? (
                                <><Activity className="h-3 w-3 mr-1" /> Open</>
                              ) : (
                                auction.status
                              )}
                            </span>
                          </div>
                          <CardDescription className="text-slate-500 text-sm line-clamp-1">
                            {auction.description}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 ml-3 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs px-2"
                            onClick={() => handleViewBids(auction.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Bids
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800 p-2">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500/70 hover:text-red-400 hover:bg-slate-800 p-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-slate-500 mb-0.5">Min. Bid</p>
                          <p className="font-bold text-white">${auction.minimum_bid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Start Date</p>
                          <p className="text-slate-300">{new Date(auction.start_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">End Date</p>
                          <p className="text-slate-300">{new Date(auction.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Bidders Panel */}
                      {selectedTender === auction.id && bidders.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-slate-800">
                          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            Active Bidders
                            <span className="ml-auto text-xs text-slate-500">{bidders.length} submissions</span>
                          </h4>
                          <div className="space-y-2.5">
                            {bidders.map((bidder) => (
                              <div key={bidder.id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-sm font-medium text-white truncate">{bidder.bidder_company}</p>
                                  <p className="text-xs text-slate-400">{bidder.bidder_name}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="text-right">
                                    <p className="text-xs text-slate-500">Amount</p>
                                    <p className="text-sm font-bold text-white">${bidder.bid_amount.toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-500">Compliance</p>
                                    <p className={`text-sm font-bold ${
                                      bidder.compliance_score >= 85 ? "text-emerald-400" :
                                      bidder.compliance_score >= 70 ? "text-amber-400" : "text-red-400"
                                    }`}>{bidder.compliance_score}%</p>
                                  </div>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                    bidder.risk_level === "Low"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : bidder.risk_level === "Medium"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-red-500/10 text-red-400 border-red-500/20"
                                  }`}>
                                    {bidder.risk_level}
                                  </span>
                                  <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs h-7 px-3">
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
          </div>

          {/* Right — Activity Feed */}
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">Activity Feed</h2>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-800/50 transition-colors">
                      <span className={`mt-0.5 shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full border ${activityColors[item.severity]}`}>
                        <ActivityIcon item={item} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 leading-snug">{item.message}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">by {item.actor}</p>
                      </div>
                      <span className="text-xs text-slate-600 shrink-0 mt-0.5">{timeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-800">
                  <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white text-xs">
                    View Full Audit Log
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats underneath feed */}
            <Card className="bg-slate-900 border-slate-800 mt-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-300">Tenders Awarded</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-4xl font-black text-white">{stats.tendersAwarded}</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2">
                  <Award className="h-3.5 w-3.5" />
                  <span>Completed successfully</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
