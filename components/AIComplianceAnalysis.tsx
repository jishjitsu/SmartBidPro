"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ComplianceAnalysis } from "@/lib/mockData"
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react"

interface AIComplianceAnalysisProps {
  data?: ComplianceAnalysis
  isProcessing?: boolean
  showDetailedBreakdown?: boolean
}

export function AIComplianceAnalysis({ 
  data, 
  isProcessing = false,
  showDetailedBreakdown = true
}: AIComplianceAnalysisProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    if (data && !isProcessing) {
      // Animate the score counter
      const targetScore = data.ai_analysis.total_score
      const duration = 1000
      const steps = 50
      const increment = targetScore / steps
      let current = 0

      const interval = setInterval(() => {
        current += increment
        if (current >= targetScore) {
          setDisplayScore(targetScore)
          clearInterval(interval)
        } else {
          setDisplayScore(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(interval)
    }
  }, [data, isProcessing])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case "Medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20"
      case "High": return "text-red-400 bg-red-500/10 border-red-500/20"
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400"
    if (score >= 70) return "text-amber-400"
    return "text-red-400"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Excellent":
      case "Good":
      case "Pass":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "Needs Improvement":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "Fail":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  if (isProcessing) {
    return (
      <Card className="bg-slate-900 border-slate-800 border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <div>
              <CardTitle className="text-lg text-white">AI Compliance Analysis</CardTitle>
              <CardDescription className="mt-1 text-slate-400">
                Processing documentation and calculating compliance scores...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-4 w-16 bg-slate-800" />
            </div>
            <Skeleton className="h-2 w-full bg-slate-800" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-4 w-16 bg-slate-800" />
            </div>
            <Skeleton className="h-2 w-full bg-slate-800" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-4 w-16 bg-slate-800" />
            </div>
            <Skeleton className="h-2 w-full bg-slate-800" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800 border-2 border-dashed">
        <CardContent className="py-12">
          <div className="text-center text-slate-500">
            <p>Upload documents to see AI compliance analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800 border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Compliance Analysis
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              Real-time analysis powered by AI
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${getRiskColor(data.ai_analysis.risk_level)} border font-semibold`}
          >
            {data.ai_analysis.risk_level} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center py-6 bg-slate-950 rounded-lg border border-slate-800">
          <p className="text-sm text-slate-400 mb-2">Overall Compliance Score</p>
          <p className={`text-6xl font-bold ${getScoreColor(displayScore)}`}>
            {displayScore}%
          </p>
          <Progress 
            value={displayScore} 
            className="h-2 mt-4 max-w-xs mx-auto bg-slate-800" 
          />
        </div>

        {/* Detailed Breakdown */}
        {showDetailedBreakdown && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">
              Compliance Breakdown
            </h4>

            {/* Documentation */}
            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.documentation.status)}
                  <span className="font-medium text-slate-300">Documentation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                    {data.ai_analysis.breakdown.documentation.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.documentation.score)}`}>
                    {data.ai_analysis.breakdown.documentation.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.documentation.score} className="h-1.5 bg-slate-800" />
              <p className="text-sm text-slate-500 mt-2">
                {data.ai_analysis.breakdown.documentation.notes}
              </p>
            </div>

            {/* Financial */}
            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.financial.status)}
                  <span className="font-medium text-slate-300">Financial</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                    {data.ai_analysis.breakdown.financial.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.financial.score)}`}>
                    {data.ai_analysis.breakdown.financial.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.financial.score} className="h-1.5 bg-slate-800" />
              <p className="text-sm text-slate-500 mt-2">
                {data.ai_analysis.breakdown.financial.notes}
              </p>
            </div>

            {/* Technical */}
            <div className="space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.technical.status)}
                  <span className="font-medium text-slate-300">Technical</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                    {data.ai_analysis.breakdown.technical.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.technical.score)}`}>
                    {data.ai_analysis.breakdown.technical.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.technical.score} className="h-1.5 bg-slate-800" />
              <p className="text-sm text-slate-500 mt-2">
                {data.ai_analysis.breakdown.technical.notes}
              </p>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {data.ai_analysis.total_score >= 80 ? (
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-400">Bid Eligible</p>
              <p className="text-sm text-emerald-500/70 mt-1">
                Your compliance score meets the minimum requirements. You can proceed with bid submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400">Action Required</p>
              <p className="text-sm text-amber-500/70 mt-1">
                Your compliance score is below the minimum threshold. Please update your documentation and improve financial indicators before submitting.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
