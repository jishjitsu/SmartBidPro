"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getVendorProfileStats, getBidderStats } from "@/lib/mockData"
import {
  Search, Filter, TrendingUp, Target, Clock, CheckCircle2,
  ShieldCheck, FileText, Zap, AlertCircle, Bell, BookOpen,
  BarChart2, MessageSquare, ChevronRight, Eye, ArrowUpRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"

// Snapshot "now" at module load — avoids impure-function-in-render lint rule
const _now = new Date().getTime()

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

// ─── Empty State Illustration ──────────────────────────────────────────────
function EmptyTendersIllustration({ theme }: { theme: "teal" | "indigo" }) {
  const color = theme === "teal" ? "#2dd4bf" : "#818cf8"
  const light = theme === "teal" ? "#0f2e2b" : "#1e1b3a"
  const mid = theme === "teal" ? "#0f766e" : "#3730a3"
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
function TenderCard({ auction, onApply, theme }: { auction: Auction; onApply: (id: string) => void; theme: "teal" | "indigo" }) {
  const daysRemaining = Math.ceil(
    (new Date(auction.end_date).getTime() - _now) / (1000 * 60 * 60 * 24)
  )
  const accentBorder = theme === "teal" ? "border-teal-500/20 hover:border-teal-500/50" : "border-indigo-500/20 hover:border-indigo-500/50"
  const accentBg = theme === "teal" ? "bg-teal-500/10" : "bg-indigo-500/10"
  const accentText = theme === "teal" ? "text-teal-400" : "text-indigo-400"
  const accentHover = theme === "teal" ? "group-hover:text-teal-400" : "group-hover:text-indigo-400"
  const btnOutline = theme === "teal" ? "border-teal-500/40 text-teal-400 hover:bg-teal-500/10" : "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
  const btnFilled = theme === "teal" ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"

  return (
    <Card className={`bg-slate-900 ${accentBorder} shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] transition-all duration-200 group`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3 mb-1">
          <CardTitle className={`text-base font-semibold text-slate-100 line-clamp-1 ${accentHover} transition-colors`}>
            {auction.title}
          </CardTitle>
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
          <span className={`font-bold ${accentText}`}>${auction.minimum_bid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Deadline</span>
          <span className="text-slate-200 font-medium">{new Date(auction.end_date).toLocaleDateString()}</span>
        </div>
        <DaysBadge days={daysRemaining} />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" className={`${btnOutline} text-xs`}>
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

// ─── Vendor Discovery Layout ───────────────────────────────────────────────
function VendorView({
  user, auctions, searchQuery, setSearchQuery, onApply, onLogout,
}: { user: User; auctions: Auction[]; searchQuery: string; setSearchQuery: (q: string) => void; onApply: (id: string) => void; onLogout: () => void }) {
  const stats = getVendorProfileStats()
  const filtered = auctions.filter(
    (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-teal-500/20 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-900/50">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  SmartBid PRO
                  <span className="ml-2 text-sm font-normal text-teal-400">· Tender Marketplace</span>
                </h1>
                <p className="text-xs text-slate-500">Welcome back, {user.name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10 text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Complete Profile
              </Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                <Search className="h-3.5 w-3.5 mr-1.5" /> Find Tenders
              </Button>
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 uppercase tracking-wide">
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
        {stats.profileStrength < 90 && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-200">Profile incomplete · {stats.profileStrength}% strength</p>
                <p className="text-xs text-amber-400 mt-0.5">Missing: {stats.missingDocs.join(", ")} — Complete to unlock more opportunities.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0 ml-4">
              Fix Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Profile Strength</CardDescription>
              <CardTitle className="text-5xl font-black text-teal-400 leading-none mt-1">{stats.profileStrength}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Progress value={stats.profileStrength} className="h-1.5 bg-slate-800 [&>div]:bg-teal-500" />
              <p className="text-xs text-slate-500">{stats.profileStrength >= 80 ? "Strong presence" : "Needs improvement"}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Verified Categories</CardDescription>
              <CardTitle className="text-5xl font-black text-teal-400 leading-none mt-1">
                {stats.verifiedCategories}<span className="text-xl font-normal text-slate-600">/{stats.totalCategories}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-xs text-teal-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{stats.totalCategories - stats.verifiedCategories} pending verification</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Applications</CardDescription>
              <CardTitle className="text-5xl font-black text-teal-400 leading-none mt-1">{stats.activeApplications}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" /><span>Awaiting evaluation</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Doc Compliance</CardDescription>
              <CardTitle className="text-5xl font-black text-teal-400 leading-none mt-1">
                {stats.documentsCompliant}<span className="text-xl font-normal text-slate-600">/{stats.totalDocuments}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{stats.documentsCompliant === stats.totalDocuments ? "Fully compliant" : `${stats.totalDocuments - stats.documentsCompliant} doc(s) need attention`}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8 bg-slate-800" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Available Tenders</h2>
            <p className="text-sm text-slate-500 mt-0.5">{auctions.length} open opportunities · sorted by closing date</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input
                placeholder="Search by keyword or industry…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:w-72 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-teal-500"
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
              <EmptyTendersIllustration theme="teal" />
              <div className="text-center">
                <p className="text-base font-semibold text-slate-200">No open tenders match your search</p>
                <p className="text-sm text-slate-500 mt-1">Set up category alerts so you never miss an opportunity.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white">
                  <Bell className="h-3.5 w-3.5 mr-1.5" /> Set Up Alerts
                </Button>
                <Button size="sm" variant="outline" className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((auction) => (
              <TenderCard key={auction.id} auction={auction} onApply={onApply} theme="teal" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Bidder Action / Workflow Layout ──────────────────────────────────────
function BidderView({
  user, auctions, searchQuery, setSearchQuery, onApply, onLogout,
}: { user: User; auctions: Auction[]; searchQuery: string; setSearchQuery: (q: string) => void; onApply: (id: string) => void; onLogout: () => void }) {
  const stats = getBidderStats()
  const filtered = [...auctions]
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .filter(
      (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-indigo-500/20 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/50">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  SmartBid PRO
                  <span className="ml-2 text-sm font-normal text-indigo-400">· Bid Manager</span>
                </h1>
                <p className="text-xs text-slate-500">Welcome back, {user.name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats.draftBids > 0 && (
                <Button variant="outline" size="sm" className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 text-xs">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Resume Draft ({stats.draftBids})
                </Button>
              )}
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                <BarChart2 className="h-3.5 w-3.5 mr-1.5" /> Track My Bids
              </Button>
              <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-400 border border-purple-500/30 uppercase tracking-wide">
                Bidder
              </span>
              <Button onClick={onLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {stats.pendingClarifications > 0 && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-200">
                  {stats.pendingClarifications} pending clarification{stats.pendingClarifications > 1 ? "s" : ""} require your response
                </p>
                <p className="text-xs text-purple-400 mt-0.5">Unanswered clarifications can disqualify your bid.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs shrink-0 ml-4">
              Respond Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Bids</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{stats.activeBids}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Clock className="h-3 w-3 mr-1" />{stats.bidsDueThisWeek} due this week
              </span>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Win Rate</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{stats.winRate}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Progress value={stats.winRate} className="h-1.5 bg-slate-800 [&>div]:bg-indigo-500" />
              <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5" /><span>Historical average</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-slate-900 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)] ${stats.pendingClarifications > 0 ? "border-purple-500/40" : "border-slate-800"}`}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Clarifications</CardDescription>
              <CardTitle className={`text-5xl font-black leading-none mt-1 ${stats.pendingClarifications > 0 ? "text-purple-400" : "text-indigo-400"}`}>
                {stats.pendingClarifications}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className={`flex items-center gap-1.5 text-xs ${stats.pendingClarifications > 0 ? "text-purple-400" : "text-slate-500"}`}>
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{stats.pendingClarifications > 0 ? "Action required" : "All responses submitted"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Compliance</CardDescription>
              <CardTitle className="text-5xl font-black text-indigo-400 leading-none mt-1">{stats.avgComplianceScore}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stats.avgComplianceScore >= 85 ? "bg-emerald-100 text-emerald-700" : stats.avgComplianceScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                <ShieldCheck className="h-3 w-3 mr-1" />
                {stats.avgComplianceScore >= 85 ? "Excellent" : stats.avgComplianceScore >= 70 ? "Acceptable" : "Needs Work"}
              </span>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8 bg-slate-800" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Open Tenders — Deadline View</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sorted by closing date · {auctions.length} open opportunities</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input
                placeholder="Search by Application ID or deadline…"
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
              <EmptyTendersIllustration theme="indigo" />
              <div className="text-center">
                <p className="text-base font-semibold text-slate-200">No tenders match your search</p>
                <p className="text-sm text-slate-500 mt-1">Try a different term or set up deadline alerts.</p>
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
              <TenderCard key={auction.id} auction={auction} onApply={onApply} theme="indigo" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────
function LoadingSkeleton({ theme }: { theme: "teal" | "indigo" }) {
  const accent = theme === "teal" ? "border-teal-500/20" : "border-indigo-500/20"
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

  const handleApplyTender = (tenderId: string) => router.push(`/vendor/apply/${tenderId}`)

  const isBidder = user?.role === "bidder"

  if (isLoading) return <LoadingSkeleton theme={isBidder ? "indigo" : "teal"} />
  if (!user) return null

  return isBidder ? (
    <BidderView user={user} auctions={auctions} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onApply={handleApplyTender} onLogout={handleLogout} />
  ) : (
    <VendorView user={user} auctions={auctions} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onApply={handleApplyTender} onLogout={handleLogout} />
  )
}

