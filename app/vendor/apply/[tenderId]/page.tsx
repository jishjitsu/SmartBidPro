"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AIComplianceAnalysis } from "@/components/AIComplianceAnalysis"
import { getMockComplianceResponse, simulateAIProcessing, ComplianceAnalysis } from "@/lib/mockData"
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"

interface Auction {
  id: string
  title: string
  description: string
  minimum_bid: number
  start_date: string
  end_date: string
}

export default function ApplyTenderPage() {
  const router = useRouter()
  const params = useParams()
  const tenderId = params.tenderId as string
  
  const [step, setStep] = useState(1)
  const [auction, setAuction] = useState<Auction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complianceData, setComplianceData] = useState<ComplianceAnalysis | undefined>()
  
  const [bidAmount, setBidAmount] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    
    fetchAuction(token)
  }, [tenderId, router])

  const fetchAuction = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${tenderId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch auction")
      }

      const data = await response.json()
      setAuction(data)
    } catch (error) {
      console.error("Error fetching auction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // Simulate file upload
    const fileNames = Array.from(files).map(f => f.name)
    setUploadedFiles([...uploadedFiles, ...fileNames])
    
    // Trigger AI analysis
    setIsProcessing(true)
    setStep(3)
    
    await simulateAIProcessing()
    
    const mockResponse = getMockComplianceResponse()
    setComplianceData(mockResponse)
    setIsProcessing(false)
  }

  const handleSubmitBid = async () => {
    if (!complianceData || complianceData.ai_analysis.total_score < 80) {
      alert("Compliance score is too low to submit bid. Please improve your documentation.")
      return
    }

    setIsSubmitting(true)
    
    // Simulate bid submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    alert("Bid submitted successfully!")
    router.push("/vendor/dashboard")
  }

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-center">Tender not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/vendor/dashboard")}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-xl font-semibold text-slate-900">
                Apply for Tender
              </h1>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              Vendor
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Tender Info */}
        <Card className="mb-8 bg-white border-emerald-100">
          <CardHeader>
            <CardTitle className="text-slate-900">{auction.title}</CardTitle>
            <CardDescription className="text-slate-600">{auction.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-slate-600">Minimum Bid</span>
                <p className="font-semibold text-emerald-700 mt-1 text-lg">
                  ${auction.minimum_bid.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Deadline</span>
                <p className="text-slate-900 mt-1">
                  {new Date(auction.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Status</span>
                <Badge className="mt-1 bg-emerald-100 text-emerald-700">
                  Open for Bidding
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-slate-600">Step {step} of {totalSteps}</span>
            <span className="text-sm text-slate-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">1</span></div>}
              <span className="text-sm font-medium">Bid Amount</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">2</span></div>}
              <span className="text-sm font-medium">Upload Documents</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center"><span className="text-xs">3</span></div>
              <span className="text-sm font-medium">AI Compliance Check</span>
            </div>
          </div>
        </div>

        {/* Step 1: Bid Amount */}
        {step === 1 && (
          <Card className="bg-white border-emerald-100">
            <CardHeader>
              <CardTitle className="text-slate-900">Enter Your Bid Amount</CardTitle>
              <CardDescription className="text-slate-600">
                Provide your competitive bid for this tender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bid Amount ($) *</label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={auction.minimum_bid.toString()}
                  className="text-lg"
                  required
                />
                {bidAmount && parseFloat(bidAmount) < auction.minimum_bid && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Bid amount is below the minimum required</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-900">
                  <strong>Minimum Bid:</strong> ${auction.minimum_bid.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  Your bid must meet or exceed the minimum bid amount to be considered.
                </p>
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!bidAmount || parseFloat(bidAmount) < auction.minimum_bid}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Next: Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Documents */}
        {step === 2 && (
          <Card className="bg-white border-emerald-100">
            <CardHeader>
              <CardTitle className="text-slate-900">Upload Required Documents</CardTitle>
              <CardDescription className="text-slate-600">
                Upload your compliance documents for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-emerald-300 rounded-lg p-12 text-center bg-emerald-50/50">
                <Upload className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">Upload Documents</h3>
                <p className="text-sm text-slate-600 mb-4">
                  PDF, DOC, or DOCX files (Max 10MB each)
                </p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Select Files
                  </Button>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Uploaded Files</label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-slate-900 flex-1">{file}</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">Required Documents:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Business Registration Certificate</li>
                  <li>Tax Clearance Certificate</li>
                  <li>Insurance Documents</li>
                  <li>Financial Statements (Last 2 years)</li>
                  <li>Technical Certifications</li>
                </ul>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="border-emerald-600 text-emerald-700"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: AI Compliance Check */}
        {step === 3 && (
          <div className="space-y-6">
            <AIComplianceAnalysis 
              data={complianceData}
              isProcessing={isProcessing}
              showDetailedBreakdown={true}
            />

            {complianceData && !isProcessing && (
              <Card className="bg-white border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-slate-900">Review Your Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <label className="text-sm text-slate-600">Bid Amount</label>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        ${parseFloat(bidAmount).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <label className="text-sm text-slate-600">Documents Uploaded</label>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        {uploadedFiles.length} files
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={() => {
                        setStep(2)
                        setComplianceData(undefined)
                      }}
                      variant="outline"
                      className="border-emerald-600 text-emerald-700"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitBid}
                      disabled={isSubmitting || complianceData.ai_analysis.total_score < 80}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Sealed Bid"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
