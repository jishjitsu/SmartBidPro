"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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

interface ComplianceScore {
  overall: number
  documentation: number
  financial: number
  technical: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock compliance data
  const [complianceScore] = useState<ComplianceScore>({
    overall: 87,
    documentation: 92,
    financial: 85,
    technical: 84
  })

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    minimum_bid: "",
    start_date: "",
    end_date: ""
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
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

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/auctions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          minimum_bid: parseFloat(formData.minimum_bid),
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          status: "Open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create auction")
      }

      const newAuction = await response.json()
      setAuctions([newAuction, ...auctions])
      setShowCreateDialog(false)
      setFormData({ title: "", description: "", minimum_bid: "", start_date: "", end_date: "" })
    } catch (error) {
      console.error("Error creating auction:", error)
      alert("Failed to create auction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAuctions = auctions.filter(auction => {
    if (activeTab === "active") return auction.status === "Open"
    if (activeTab === "closed") return auction.status === "Closed"
    return true
  })

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === "Open").length,
    closed: auctions.filter(a => a.status === "Closed").length,
    myBids: 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="border-b">
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold">
                SmartBid PRO
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Badge variant="outline">
                {user?.role}
              </Badge>
              <Button onClick={handleLogout} variant="ghost" size="sm">
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
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Auctions</CardDescription>
              <CardTitle className="text-4xl">
                {stats.total}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Tenders</CardDescription>
              <CardTitle className="text-4xl">
                {stats.active}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Compliance Score</CardDescription>
              <CardTitle className="text-4xl">
                {complianceScore.overall}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={complianceScore.overall} className="h-1.5" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>My Bids</CardDescription>
              <CardTitle className="text-4xl">
                {stats.myBids}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Compliance Quick View */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
              AI Compliance Analysis
            </CardTitle>
            <CardDescription>Real-time compliance scoring powered by AI (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Documentation</span>
                  <span className="text-sm text-muted-foreground">{complianceScore.documentation}%</span>
                </div>
                <Progress value={complianceScore.documentation} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Financial</span>
                  <span className="text-sm text-muted-foreground">{complianceScore.financial}%</span>
                </div>
                <Progress value={complianceScore.financial} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Technical</span>
                  <span className="text-sm text-muted-foreground">{complianceScore.technical}%</span>
                </div>
                <Progress value={complianceScore.technical} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-12" />

        {/* Tabs and Actions */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              onClick={() => setActiveTab("all")}
              size="sm"
            >
              All Tenders
            </Button>
            <Button
              variant={activeTab === "active" ? "default" : "ghost"}
              onClick={() => setActiveTab("active")}
              size="sm"
            >
              Active ({stats.active})
            </Button>
            <Button
              variant={activeTab === "closed" ? "default" : "ghost"}
              onClick={() => setActiveTab("closed")}
              size="sm"
            >
              Closed ({stats.closed})
            </Button>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
          >
            Create Tender
          </Button>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <p className="text-base">No tenders found</p>
                <p className="text-sm mt-2">Create your first tender to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map((auction) => (
              <Card key={auction.id} className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-1">{auction.title}</CardTitle>
                    <Badge variant={auction.status === "Open" ? "default" : "secondary"}>
                      {auction.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {auction.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Bid</span>
                      <span className="font-medium">${auction.minimum_bid.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{new Date(auction.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span>{new Date(auction.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View
                    </Button>
                    {auction.status === "Open" && (
                      <Button size="sm" className="flex-1">
                        Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Auction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tender</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new tender
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAuction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter tender title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter tender description"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Bid ($)</label>
              <Input
                type="number"
                value={formData.minimum_bid}
                onChange={(e) => setFormData({ ...formData, minimum_bid: e.target.value })}
                placeholder="10000"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tender"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
