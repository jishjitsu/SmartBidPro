"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getVendorProfileStats, getBidderStats } from "@/lib/mockData"
import {
  Search, FileText, Filter, TrendingUp, Target, Clock, CheckCircle2,
  ShieldCheck, Bell, BarChart2, MessageSquare, ChevronRight, Eye, ArrowUpRight, Award, AlertCircle,
  Building2, Laptop, Briefcase, HeartPulse, GraduationCap, Truck, Shield, Sprout,
  Zap, Factory, Users, HardHat, Wrench, Package,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface VendorBid {
  id: string
  tender_id: string
  vendor_id: string
  vendor_name: string
  vendor_company: string
  bid_amount: number
  proposal_text: string
  documents?: string[]
  compliance_analysis?: {
    total_score: number
    risk_level: "Low" | "Medium" | "High"
  }
  status: "Applied" | "Awarded" | "Rejected"
  created_at: string
  updated_at: string
}

// Category Icons Configuration
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  construction: Building2,
  it_services: Laptop,
  healthcare: HeartPulse,
  education: GraduationCap,
  transportation: Truck,
  defense: Shield,
  agriculture: Sprout,
  energy: Zap,
  manufacturing: Factory,
  consulting: Users,
  infrastructure: HardHat,
  maintenance: Wrench,
  supplies: Package,
  general: Briefcase,
}

const CATEGORY_LABELS: Record<string, string> = {
  construction: "Construction",
  it_services: "IT Services",
  healthcare: "Healthcare",
  education: "Education",
  transportation: "Transportation",
  defense: "Defense & Security",
  agriculture: "Agriculture",
  energy: "Energy & Utilities",
  manufacturing: "Manufacturing",
  consulting: "Consulting Services",
  infrastructure: "Infrastructure",
  maintenance: "Maintenance & Repair",
  supplies: "Supplies & Equipment",
  general: "General Procurement",
}

const CATEGORY_COLORS: Record<string, string> = {
  construction: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  it_services: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  healthcare: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  education: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  transportation: "bg-green-500/15 text-green-300 border-green-500/25",
  defense: "bg-red-500/15 text-red-300 border-red-500/25",
  agriculture: "bg-lime-500/15 text-lime-300 border-lime-500/25",
  energy: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  manufacturing: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  consulting: "bg-teal-500/15 text-teal-300 border-teal-500/25",
  infrastructure: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  maintenance: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  supplies: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  general: "bg-slate-500/15 text-slate-300 border-slate-500/25",
}

interface Auction {
  id: string
  title: string
  description: string
  status: string
  created_by: string
  start_date: string
  end_date: string
  minimum_bid: number
  category?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

// ─── Empty State Illustration ──────────────────────────────────────────────
function EmptyTendersIllustration() {
  const color = "#818cf8"
  const light = "#1e1b3a"
  const mid = "#3730a3"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 160"
      className="w-44 h-36 mx-auto"
      aria-hidden="true"
    >
      <rect x="30" y="55" width="130" height="88" rx="10" fill={light} stroke={mid} strokeWidth="2" />
      <path d="M30 55 Q30 45 40 45 L90 45 Q100 45 105 55Z" fill={mid} />
      <rect x="50" y="80" width="60" height="5" rx="2.5" fill={mid} />
      <rect x="50" y="94" width="45" height="5" rx="2.5" fill={mid} />
      <rect x="50" y="108" width="52" height="5" rx="2.5" fill={mid} />
      <circle cx="148" cy="98" r="26" fill="#0f172a" stroke={color} strokeWidth="3" />
      <circle cx="148" cy="98" r="18" fill={light} />
      <line x1="167" y1="117" x2="182" y2="132" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx="148" cy="98" r="6" fill="none" stroke={color} strokeWidth="2" />
      <line x1="148" y1="85" x2="148" y2="91" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="148" y1="105" x2="148" y2="111" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Days Badge ────────────────────────────────────────────────────────────
function DaysBadge({ days }: { days: number }) {
  if (days <= 2)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <Clock className="h-3 w-3" /> {days}d left · Urgent
      </span>
    )
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> {days}d left · Closing Soon
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {days}d remaining
    </span>
  )
}

// ─── Tender Card ───────────────────────────────────────────────────────────
function TenderCard({ auction, onApply, onViewDetails }: { auction: Auction; onApply: (id: string) => void; onViewDetails: (auction: Auction) => void }) {
  const daysRemaining = Math.ceil(
    // eslint-disable-next-line react-hooks/purity
    (new Date(auction.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const accentBorder = "border-indigo-500/20 hover:border-indigo-500/50"
  const accentBg = "bg-indigo-500/10"
  const accentText = "text-indigo-400"
  const accentHover = "group-hover:text-indigo-400"
  const btnOutline = "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
  const btnFilled = "bg-indigo-600 hover:bg-indigo-500 text-white"

  const category = (auction.category || 'general') as keyof typeof CATEGORY_ICONS
  const CategoryIcon = CATEGORY_ICONS[category] || Briefcase
  const categoryLabel = CATEGORY_LABELS[category] || "General"
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  return (
    <Card className={`bg-slate-900 ${accentBorder} shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] transition-all duration-200 group`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CardTitle className={`text-base font-semibold text-slate-100 line-clamp-1 ${accentHover} transition-colors`}>
              {auction.title}
            </CardTitle>
            <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${categoryColor}`}>
              <CategoryIcon className="h-3 w-3 mr-1" />
              {categoryLabel}
            </span>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Open
          </span>
        </div>
        <CardDescription className="text-slate-400 text-sm line-clamp-2">
          {auction.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex justify-between items-center py-2 px-3 ${accentBg} rounded-lg`}>
          <span className="text-xs font-medium text-slate-400">Minimum Bid</span>
          <span className={`font-bold ${accentText}`}>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(auction.minimum_bid)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Deadline</span>
          <span className="text-slate-200 font-medium">{new Date(auction.end_date).toLocaleDateString()}</span>
        </div>
        <DaysBadge days={daysRemaining} />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className={`${btnOutline} text-xs`}
            onClick={() => onViewDetails(auction)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
          </Button>
          <Button size="sm" className={`${btnFilled} text-xs`} onClick={() => onApply(auction.id)}>
            Apply Now <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Unified Vendor Dashboard ──────────────────────────────────────────────
function UnifiedVendorView({
  user, auctions, searchQuery, setSearchQuery, onApply, onLogout,
}: { user: User; auctions: Auction[]; searchQuery: string; setSearchQuery: (q: string) => void; onApply: (id: string) => void; onLogout: () => void }) {
  const router = useRouter()
  const vendorStats = getVendorProfileStats()
  const bidderStats = getBidderStats()
  
  const [activeTab, setActiveTab] = useState<"tenders" | "bids">("tenders")
  const [myBids, setMyBids] = useState<VendorBid[]>([])
  const [isLoadingBids, setIsLoadingBids] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  
  const filtered = [...auctions]
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .filter(
      (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // Fetch vendor bids when switching to "My Bids" tab
  useEffect(() => {
    if (activeTab === "bids") {
      fetchMyBids()
    }
  }, [activeTab])

  const fetchMyBids = async () => {
    setIsLoadingBids(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:8000/api/vendor/bids", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error("Failed to fetch bids:", response.statusText)
        return
      }

      const bids = await response.json()
      setMyBids(bids)
    } catch (error) {
      console.error("Error fetching bids:", error)
    } finally {
      setIsLoadingBids(false)
    }
  }

  // Fetch bids on mount to update counters
  useEffect(() => {
    fetchMyBids()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header with Profile Strength Indicator */}
      <header className="border-b border-indigo-500/20 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/50">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  SmartBid PRO
                  <span className="ml-2 text-sm font-normal text-indigo-400">· Unified Dashboard</span>
                </h1>
                <p className="text-xs text-slate-500">Welcome back, {user.name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs" onClick={() => router.push("/vendor/settings")}>
                <Wrench className="h-3.5 w-3.5 mr-1.5" /> Settings
              </Button>
              <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
                Vendor
              </span>
              <Button onClick={onLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Alert Banners */}
        <div className="space-y-4 mb-8">
          {/* Profile Strength Alert */}
          {vendorStats.profileStrength < 90 && (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-200">
                    Profile Strength: {vendorStats.profileStrength}%
                  </p>
                  <p className="text-xs text-amber-400 mt-0.5">
                    Missing: {vendorStats.missingDocs.join(", ")} — Complete to unlock more opportunities.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0 ml-4" onClick={() => router.push("/vendor/settings")}>
                Complete Profile <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
          
          {/* Verified Categories Alert */}
          {vendorStats.verifiedCategories < vendorStats.totalCategories && (
            <div className="flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-orange-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-200">
                    {vendorStats.verifiedCategories}/{vendorStats.totalCategories} Categories Verified  
                  </p>
                  <p className="text-xs text-orange-400 mt-0.5">
                    {vendorStats.totalCategories - vendorStats.verifiedCategories} pending verification — Complete to bid on more tenders.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs shrink-0 ml-4" onClick={() => router.push("/vendor/settings")}>
                Verify Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
          
        </div>

        {/* Primary Stats Row - 4 Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {/* Active Bids */}
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Bids</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{bidderStats.activeBids}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Clock className="h-3 w-3 mr-1" />{bidderStats.bidsDueThisWeek} due this week
              </span>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Win Rate</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{bidderStats.winRate}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Progress value={bidderStats.winRate} className="h-1.5 bg-slate-800 [&>div]:bg-indigo-500" />
              <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5" /><span>Historical average</span>
              </div>
            </CardContent>
          </Card>

          {/* Clarification Pending */}
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Clarification Pending</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">
                {bidderStats.pendingClarifications}
                <span className="text-xs font-normal text-slate-500 ml-2 block sm:inline mt-1 sm:mt-0">(this will affect your bid acceptance)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-3">
                 <AlertCircle className="h-3.5 w-3.5" />
                 <span>Action Required</span>
              </div>
              <Button size="sm" variant="outline" className="w-full border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs h-8">
                Address Clarifications
              </Button>
            </CardContent>
          </Card>

          {/* Average Compliance */}
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Compliance</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{bidderStats.avgComplianceScore}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${bidderStats.avgComplianceScore >= 85 ? "bg-emerald-100 text-emerald-700" : bidderStats.avgComplianceScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                <Award className="h-3 w-3 mr-1" />
                {bidderStats.avgComplianceScore >= 85 ? "Excellent" : bidderStats.avgComplianceScore >= 70 ? "Acceptable" : "Needs Work"}
              </span>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8 bg-slate-800" />

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("tenders")}
            className={`px-6 ${activeTab === "tenders" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"}`}
          >
            <Target className="h-4 w-4 mr-2" />
            Available Tenders
          </Button>
          <Button
            onClick={() => setActiveTab("bids")}
            className={`px-6 ${activeTab === "bids" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-400"}`}
          >
            <Award className="h-4 w-4 mr-2" />
            My Bids ({myBids.length})
          </Button>
        </div>

        {/* Available Tenders Section */}
        {activeTab === "tenders" && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">Available Tenders — Deadline View</h2>
                <p className="text-sm text-slate-500 mt-0.5">{auctions.length} open opportunities · sorted by closing date</p>
              </div>
              <div className="flex gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <Input
                    placeholder="Search by keyword or deadline…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:w-72 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800 shrink-0">
                  <Filter className="h-4 w-4 mr-1.5" /> Filter
                </Button>
              </div>
            </div>

        {filtered.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardContent className="py-20 flex flex-col items-center gap-4">
              <EmptyTendersIllustration />
              <div className="text-center">
                <p className="text-base font-semibold text-slate-200">No tenders match your search</p>
                <p className="text-sm text-slate-500 mt-1">Set up deadline alerts so you never miss an opportunity.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Bell className="h-3.5 w-3.5 mr-1.5" /> Set Up Alerts
                </Button>
                <Button size="sm" variant="outline" className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((auction) => (
              <TenderCard 
                key={auction.id} 
                auction={auction} 
                onApply={onApply} 
                onViewDetails={setSelectedAuction}
              />
            ))}
          </div>
        )}
          </>
        )}

        {/* My Bids Section */}
        {activeTab === "bids" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">My Bids</h2>
              <p className="text-sm text-slate-500 mt-0.5">Track all your submitted bids and their status</p>
            </div>

            {isLoadingBids ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl bg-slate-800" />)}
              </div>
            ) : myBids.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
                <CardContent className="py-20 flex flex-col items-center gap-4">
                  <div className="text-center">
                    <Award className="h-16 w-16 mx-auto text-slate-700 mb-4" />
                    <p className="text-base font-semibold text-slate-200">No Bids Yet</p>
                    <p className="text-sm text-slate-500 mt-1">Browse available tenders and submit your first bid</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
                    onClick={() => setActiveTab("tenders")}
                  >
                    <Target className="h-3.5 w-3.5 mr-1.5" /> Browse Tenders
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {myBids.map((bid: VendorBid) => (
                  <Card key={bid.id} className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all hover:border-indigo-500/30">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <CardTitle className="text-base font-bold text-white leading-tight line-clamp-2">
                          Tender ID: {bid.tender_id}
                        </CardTitle>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border shrink-0 ${
                          bid.status === "Applied" 
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : bid.status === "Awarded"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Bid Amount</p>
                          <p className="text-lg font-bold text-indigo-400">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(bid.bid_amount)}
                          </p>
                        </div>
                        {bid.compliance_analysis && (
                          <div>
                            <p className="text-xs text-slate-500">Compliance</p>
                            <p className={`text-lg font-bold ${
                              bid.compliance_analysis.total_score >= 85 ? "text-emerald-400" :
                              bid.compliance_analysis.total_score >= 70 ? "text-amber-400" : "text-red-400"
                            }`}>
                              {bid.compliance_analysis.total_score}%
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Proposal</p>
                        <p className="text-sm text-slate-300 line-clamp-2">{bid.proposal_text}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                        {bid.compliance_analysis && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            bid.compliance_analysis.risk_level === "Low"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : bid.compliance_analysis.risk_level === "Medium"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {bid.compliance_analysis.risk_level} Risk
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

      {/* Tender Details Dialog */}
      <Dialog open={!!selectedAuction} onOpenChange={(open) => !open && setSelectedAuction(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              {selectedAuction?.title}
              {selectedAuction && (
                <span className={`text-xs ml-4 font-normal px-2.5 py-0.5 rounded-full border ${
                  CATEGORY_COLORS[(selectedAuction.category || 'general') as keyof typeof CATEGORY_ICONS] || CATEGORY_COLORS.general
                }`}>
                  {CATEGORY_LABELS[(selectedAuction.category || 'general') as keyof typeof CATEGORY_LABELS] || "General"}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400 flex items-center gap-2 mt-1">
               <Clock className="w-3.5 h-3.5" /> 
               Deadline: {selectedAuction ? new Date(selectedAuction.end_date).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Minimum Bid Required</span>
                <span className="text-xl font-bold text-indigo-400">
                  {selectedAuction && new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(selectedAuction.minimum_bid)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Description & Requirements
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-4">
                {selectedAuction?.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                 <span className="text-slate-500 block mb-1">Status</span>
                 <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   {selectedAuction?.status}
                 </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                 <span className="text-slate-500 block mb-1">Created By</span>
                 <span className="font-medium text-slate-200">{selectedAuction?.created_by}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => setSelectedAuction(null)} className="text-slate-400 hover:text-white hover:bg-slate-800">
               Close
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => selectedAuction && onApply(selectedAuction.id)}>
              Apply Now <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────
function LoadingSkeleton() {
  const accent = "border-indigo-500/20"
  return (
    <div className="min-h-screen bg-slate-950">
      <header className={`border-b ${accent} bg-slate-950/95`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4"><Skeleton className="h-8 w-56 bg-slate-800" /></div>
      </header>
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl bg-slate-800" />)}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl bg-slate-800" />)}
        </div>
      </main>
    </div>
  )
}

// ─── Root Page ─────────────────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const router = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    if (!token || !userData) { router.push("/login"); return }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role === "admin") { router.push("/admin/dashboard"); return }
    setUser(parsedUser)
    fetchAuctions(token)
  }, [router])

  const fetchAuctions = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch auctions")
      const data = await response.json()
      // Map MongoDB _id to id for frontend compatibility
      const mappedData = data.map((auction: Auction & { _id?: string }) => ({
        ...auction,
        id: auction._id || auction.id,
      }))
      setAuctions(mappedData.filter((a: Auction) => a.status === "Open"))
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

  const handleApplyTender = (tenderId: string) => router.push(`/vendor/apply/${tenderId}`)

  if (isLoading) return <LoadingSkeleton />
  if (!user) return null

  return (
    <UnifiedVendorView 
      user={user} 
      auctions={auctions} 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery} 
      onApply={handleApplyTender} 
      onLogout={handleLogout} 
    />
  )
}

