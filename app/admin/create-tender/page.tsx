"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { generateMockRequirements } from "@/lib/mockData"
import { ArrowLeft, Sparkles, CheckCircle2, Loader2 } from "lucide-react"

export default function CreateTenderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    minimum_bid: "",
    start_date: "",
    end_date: "",
    requirements: ""
  })

  const handleGenerateRequirements = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation with animation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const generated = generateMockRequirements(formData.category)
    setFormData({ ...formData, requirements: generated })
    setIsGenerating(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem("token")
      // Convert INR to USD for backend storage (divide by 82.5)
      const minimumBidUSD = parseFloat(formData.minimum_bid) / 82.5
      
      const response = await fetch("http://localhost:8000/api/auctions", {
        method: "POST",
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
          status: "Open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create tender")
      }

      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Error creating tender:", error)
      alert("Failed to create tender")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

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
                Create New Tender
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
        {/* Progress */}
        <div className="mb-12">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-slate-400">Step {step} of {totalSteps}</span>
            <span className="text-sm text-slate-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-slate-600'}`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">1</span></div>}
              <span className="text-sm font-medium">Basic Details</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-slate-600'}`}>
              {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">2</span></div>}
              <span className="text-sm font-medium">Requirements</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">3</span></div>
              <span className="text-sm font-medium">Review & Publish</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Basic Tender Details</CardTitle>
              <CardDescription className="text-slate-400">
                Provide the fundamental information about this tender
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

              <div className="flex justify-end pt-6">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.title || !formData.description || !formData.minimum_bid || !formData.start_date || !formData.end_date}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: Requirements
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Requirements */}
        {step === 2 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Tender Requirements</CardTitle>
              <CardDescription className="text-slate-400">
                Define the requirements or let AI generate them for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div>
                  <p className="font-medium text-blue-400">AI Requirements Generator</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Automatically generate professional tender requirements based on category
                  </p>
                </div>
                <Button
                  onClick={handleGenerateRequirements}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-Generate
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Requirements *</label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Enter tender requirements or click 'Auto-Generate' above"
                  className="bg-slate-800 border-slate-700 text-white min-h-96 font-mono text-sm"
                  required
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.requirements}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Review & Publish</CardTitle>
              <CardDescription className="text-slate-400">
                Review all details before publishing the tender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <label className="text-sm text-slate-500">Title</label>
                  <p className="text-white font-medium mt-1">{formData.title}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <label className="text-sm text-slate-500">Description</label>
                  <p className="text-white mt-1">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <label className="text-sm text-slate-500">Category</label>
                    <p className="text-white font-medium mt-1 capitalize">
                      {formData.category.replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <label className="text-sm text-slate-500">Minimum Bid</label>
                    <p className="text-white font-medium mt-1">
                    ₹{parseFloat(formData.minimum_bid).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <label className="text-sm text-slate-500">Start Date</label>
                    <p className="text-white font-medium mt-1">
                      {new Date(formData.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <label className="text-sm text-slate-500">End Date</label>
                    <p className="text-white font-medium mt-1">
                      {new Date(formData.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <label className="text-sm text-slate-500">Requirements</label>
                  <pre className="text-white mt-2 text-sm whitespace-pre-wrap font-mono">
                    {formData.requirements}
                  </pre>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  onClick={() => setStep(2)}
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Publish Tender
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
