"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AIComplianceAnalysis } from "@/components/AIComplianceAnalysis"
import { getMockComplianceResponse, simulateAIProcessing, ComplianceAnalysis } from "@/lib/mockData"
import { ArrowLeft, ArrowRight, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface Auction {
  _id: string
  title: string
  description: string
  minimum_bid: number
  start_date: string
  end_date: string
}

export default function ApplyTenderPage() {
  const router = useRouter()
  const params = useParams()
  // Ensure tenderId is a string
  const tenderId = Array.isArray(params.tenderId) ? params.tenderId[0] : (params.tenderId || "")
  
  const [step, setStep] = useState(1)
  const [auction, setAuction] = useState<Auction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complianceData, setComplianceData] = useState<ComplianceAnalysis | undefined>()
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const [bidAmount, setBidAmount] = useState("")
  const [proposalText, setProposalText] = useState("")
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
    if (!bidAmount || isNaN(parseFloat(bidAmount))) {
      setErrorMessage("Please enter a valid bid amount")
      return
    }

    if (!proposalText.trim()) {
      setErrorMessage("Proposal text is required")
      return
    }

    if (complianceData && complianceData.ai_analysis.total_score < 80) {
      setErrorMessage("Compliance score is too low to submit bid. Please improve your documentation.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const bidData = {
        bid_amount: isNaN(parseFloat(bidAmount)) ? 0 : parseFloat(bidAmount),
        proposal_text: proposalText || "",
        documents: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        compliance_analysis: complianceData?.ai_analysis?.breakdown ? {
          total_score: Math.round(complianceData.ai_analysis?.total_score || 0),
          risk_level: complianceData.ai_analysis?.risk_level || "Medium",
          documentation: {
            score: Math.round(complianceData.ai_analysis.breakdown.documentation?.score || 0),
            status: complianceData.ai_analysis.breakdown.documentation?.status || "Pass",
            notes: complianceData.ai_analysis.breakdown.documentation?.notes || "No notes",
          },
          financial: {
            score: Math.round(complianceData.ai_analysis.breakdown.financial?.score || 0),
            status: complianceData.ai_analysis.breakdown.financial?.status || "Pass",
            notes: complianceData.ai_analysis.breakdown.financial?.notes || "No notes",
          },
          technical: {
            score: Math.round(complianceData.ai_analysis.breakdown.technical?.score || 0),
            status: complianceData.ai_analysis.breakdown.technical?.status || "Pass",
            notes: complianceData.ai_analysis.breakdown.technical?.notes || "No notes",
          },
        } : undefined,
      }

      const response = await fetch(`http://localhost:8000/api/tenders/${tenderId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(bidData),
      })

      if (response.status === 409) {
        setErrorMessage("You have already applied to this tender")
        setHasAlreadyApplied(true)
        setIsSubmitting(false)
        return
      }

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Bid submission failed:", errorData)
        setErrorMessage("Failed to submit bid. Please try again.")
        setIsSubmitting(false)
        return
      }

      const result = await response.json()
      console.log("Bid submitted successfully:", result)
      
      alert("Bid submitted successfully! You will be notified of the outcome.")
      router.push("/vendor/dashboard")
    } catch (error) {
      console.error("Error submitting bid:", error)
      setErrorMessage("An error occurred while submitting your bid. Please try again.")
      setIsSubmitting(false)
    }
  }

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-slate-400">Loading tender details...</p>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-800 p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Tender Not Found</h2>
          <p className="text-slate-400 mb-6">
            The tender you are looking for does not exist or has been removed.
          </p>
          <Button 
            onClick={() => router.push("/vendor/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/vendor/dashboard")}
                className="text-slate-400 hover:text-white hover:bg-slate-800 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-800" />
              <h1 className="text-lg font-semibold text-white">
                Submit Proposal
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline-block">Time Remaining</span>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                {auction && new Date(auction.end_date) > new Date() ? 
                  `${Math.ceil((new Date(auction.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days Left` : 
                  'Expired'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Summary and Steps */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-slate-900 border-slate-800 shadow-xl">
             <h2 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
               Tender Summary
             </h2>
             <div className="space-y-4">
               <div>
                 <h3 className="text-white text-lg font-semibold mb-1">
                   {auction.title}
                 </h3>
                 <p className="text-slate-400 text-sm line-clamp-3">
                   {auction.description}
                 </p>
               </div>
 
               <div className="pt-4 border-t border-slate-800 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Project ID</span>
                   <span className="text-slate-300 font-mono">
                     {auction._id ? auction._id.slice(0, 8) : "N/A"}
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Opening Bid</span>
                   <span className="text-emerald-400 font-medium">
                     {new Intl.NumberFormat("en-IN", {
                       style: "currency",
                       currency: "INR",
                       maximumFractionDigits: 0,
                     }).format(auction.minimum_bid)}
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Deadline</span>
                   <span className="text-slate-300">
                     {new Date(auction.end_date).toLocaleDateString()}
                   </span>
                 </div>
               </div>
             </div>
           </Card>

           {/* Progress Steps (Vertical) */}
           <div className="hidden lg:block space-y-4">
             <div className={`flex items-center gap-4 p-4 rounded-lg border ${step === 1 ? "bg-indigo-500/10 border-indigo-500/50" : "bg-slate-900 border-slate-800"}`}>
               <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step > 1 ? "bg-emerald-500 border-emerald-500 text-white" : step === 1 ? "border-indigo-500 text-indigo-400" : "border-slate-600 text-slate-600"}`}>
                 {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
               </div>
               <div>
                 <p className={`font-medium ${step === 1 ? "text-indigo-400" : "text-slate-300"}`}>Bid Details</p>
                 <p className="text-xs text-slate-500">Financials & Proposal</p>
               </div>
             </div>
             
             <div className={`flex items-center gap-4 p-4 rounded-lg border ${step === 2 ? "bg-indigo-500/10 border-indigo-500/50" : "bg-slate-900 border-slate-800"}`}>
               <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step > 2 ? "bg-emerald-500 border-emerald-500 text-white" : step === 2 ? "border-indigo-500 text-indigo-400" : "border-slate-600 text-slate-600"}`}>
                 {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
               </div>
               <div>
                 <p className={`font-medium ${step === 2 ? "text-indigo-400" : "text-slate-300"}`}>Documents</p>
                 <p className="text-xs text-slate-500">Upload Requirements</p>
               </div>
             </div>

             <div className={`flex items-center gap-4 p-4 rounded-lg border ${step === 3 ? "bg-indigo-500/10 border-indigo-500/50" : "bg-slate-900 border-slate-800"}`}>
               <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step > 3 ? "bg-emerald-500 border-emerald-500 text-white" : step === 3 ? "border-indigo-500 text-indigo-400" : "border-slate-600 text-slate-600"}`}>
                 {step > 3 ? <CheckCircle2 className="h-5 w-5" /> : "3"}
               </div>
               <div>
                 <p className={`font-medium ${step === 3 ? "text-indigo-400" : "text-slate-300"}`}>Compliance Check</p>
                 <p className="text-xs text-slate-500">AI Verification</p>
               </div>
             </div>
           </div>
        </div>

        {/* Right Side: Main Form Area */}
        <div className="lg:col-span-8">

        {/* Step 1 of 3: Bid Amount */}
        {step === 1 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Enter Your Bid</CardTitle>
              <CardDescription className="text-slate-400">
                Provide your competitive bid and proposal for this tender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {hasAlreadyApplied && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>You have already submitted a bid for this tender. Check your bid status in the dashboard.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Bid Amount (INR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={auction.minimum_bid.toString()}
                    className="pl-8 text-lg bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
                    required
                    disabled={hasAlreadyApplied}
                  />
                </div>
                {bidAmount && parseFloat(bidAmount) < auction.minimum_bid && (
                  <div className="flex items-center gap-2 text-amber-500 text-sm mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Bid amount is below the minimum required</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Proposal *</label>
                <Textarea
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  placeholder="Describe your approach, qualifications, and why you're the best fit for this tender..."
                  className="min-h-[150px] bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
                  required
                  disabled={hasAlreadyApplied}
                />
                <p className="text-xs text-slate-500">
                  Provide a detailed proposal outlining your approach and qualifications
                </p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-emerald-400">
                  <strong>Minimum Bid:</strong> {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(auction.minimum_bid)}
                </p>
                <p className="text-xs text-emerald-500/70 mt-2">
                  Your bid must meet or exceed the minimum bid amount to be considered.
                </p>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-800">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!bidAmount || !proposalText.trim() || parseFloat(bidAmount) < auction.minimum_bid || hasAlreadyApplied}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Next: Upload Documents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Documents */}
        {step === 2 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Upload Documents (Optional)</CardTitle>
              <CardDescription className="text-slate-400">
                Upload your compliance documents for AI analysis or skip to submit your bid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-12 text-center bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-indigo-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">Upload Documents</h3>
                <p className="text-sm text-slate-400 mb-4">
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
                <Button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Select Files
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Uploaded Files</label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      <span className="text-sm text-slate-300 flex-1">{file}</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <p className="text-sm text-sky-400 font-medium mb-2">Recommended Documents:</p>
                <ul className="text-sm text-sky-300/80 space-y-1 list-disc list-inside">
                  <li>Business Registration Certificate</li>
                  <li>Tax Clearance Certificate</li>
                  <li>Insurance Documents</li>
                  <li>Financial Statements (Last 2 years)</li>
                  <li>Technical Certifications</li>
                </ul>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-800">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={async () => {
                    if (uploadedFiles.length === 0) {
                      // Skip AI analysis and go to submit
                      handleSubmitBid()
                    }
                    // If files uploaded, AI analysis will trigger automatically
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {uploadedFiles.length === 0 ? "Skip & Submit Bid" : "Waiting for Analysis..."}
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
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Review Your Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <label className="text-sm text-slate-400">Bid Amount</label>
                      <p className="text-lg font-semibold text-white mt-1">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(bidAmount))}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <label className="text-sm text-slate-400">Documents Uploaded</label>
                      <p className="text-lg font-semibold text-white mt-1">
                        {uploadedFiles.length} files
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <label className="text-sm text-slate-400 block mb-2">Proposal Summary</label>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {proposalText}
                    </p>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-800">
                    <Button
                      onClick={() => {
                        setStep(2)
                        setComplianceData(undefined)
                      }}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitBid}
                      disabled={isSubmitting || (complianceData && complianceData.ai_analysis.total_score < 80)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Sealed Bid"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
