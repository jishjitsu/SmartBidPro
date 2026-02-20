"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

const USD_TO_INR = 82.5

export default function EditTenderPage() {
  const router = useRouter()
  const params = useParams()
  const tenderId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    minimum_bid: "",
    start_date: "",
    end_date: "",
    status: "Open"
  })

  useEffect(() => {
    const fetchTender = async () => {
      console.log("Fetching tender with ID:", tenderId) // Debug log
      
      if (!tenderId) {
        console.error("Tender ID is undefined")
        alert("Error: Tender ID is missing")
        router.push("/admin/dashboard")
        return
      }
      
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:8000/api/auctions/${tenderId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch tender")
        }

        const tender = await response.json()
        console.log("Fetched tender:", tender) // Debug log
        
        // Convert USD to INR for display
        const minimumBidINR = tender.minimum_bid * USD_TO_INR
        
        setFormData({
          title: tender.title,
          description: tender.description,
          category: tender.category || "general",
          minimum_bid: minimumBidINR.toString(),
          start_date: tender.start_date.split('T')[0],
          end_date: tender.end_date.split('T')[0],
          status: tender.status
        })
      } catch (error) {
        console.error("Error fetching tender:", error)
        alert("Failed to load tender details")
        router.push("/admin/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTender()
  }, [tenderId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem("token")
      // Convert INR to USD for backend storage
      const minimumBidUSD = parseFloat(formData.minimum_bid) / USD_TO_INR
      
      const response = await fetch(`http://localhost:8000/api/auctions/${tenderId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          minimum_bid: minimumBidUSD,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          status: formData.status
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update tender")
      }

      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Error updating tender:", error)
      alert("Failed to update tender")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-32 bg-slate-800" />
                <div className="h-6 w-px bg-slate-700" />
                <Skeleton className="h-6 w-48 bg-slate-800" />
              </div>
              <Skeleton className="h-6 w-16 bg-slate-800" />
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-800 mb-2" />
              <Skeleton className="h-4 w-full bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full bg-slate-800" />
              <Skeleton className="h-32 w-full bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/dashboard")}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl font-semibold text-white">
                Edit Tender
              </h1>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit}>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Tender Details</CardTitle>
              <CardDescription className="text-slate-400">
                Update the tender information below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tender Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Highway Construction Project Phase 2"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the tender scope and objectives"
                  className="bg-slate-800 border-slate-700 text-white min-h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white"
                    aria-label="Tender category"
                  >
                    <option value="general">General Procurement</option>
                    <option value="construction">Construction</option>
                    <option value="it_services">IT Services</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="transportation">Transportation</option>
                    <option value="defense">Defense & Security</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="energy">Energy & Utilities</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="consulting">Consulting Services</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="maintenance">Maintenance & Repair</option>
                    <option value="supplies">Supplies & Equipment</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white"
                    aria-label="Tender status"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Awarded">Awarded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Minimum Bid Amount (₹) *</label>
                <Input
                  type="number"
                  value={formData.minimum_bid}
                  onChange={(e) => setFormData({ ...formData, minimum_bid: e.target.value })}
                  placeholder="8250000"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-500">Enter amount in Indian Rupees (e.g., ₹82,50,000)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Start Date *</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500">Cannot select past dates</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">End Date *</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500">Must be after start date</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={() => router.push("/admin/dashboard")}
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}
