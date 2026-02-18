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
      case "Low": return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "Medium": return "text-amber-600 bg-amber-50 border-amber-200"
      case "High": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600"
    if (score >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Excellent":
      case "Good":
      case "Pass":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "Needs Improvement":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case "Fail":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  if (isProcessing) {
    return (
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div>
              <CardTitle className="text-lg">AI Compliance Analysis</CardTitle>
              <CardDescription className="mt-1">
                Processing documentation and calculating compliance scores...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>Upload documents to see AI compliance analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              AI Compliance Analysis
            </CardTitle>
            <CardDescription className="mt-1">
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
        <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
          <p className="text-sm text-muted-foreground mb-2">Overall Compliance Score</p>
          <p className={`text-6xl font-bold ${getScoreColor(displayScore)}`}>
            {displayScore}%
          </p>
          <Progress 
            value={displayScore} 
            className="h-2 mt-4 max-w-xs mx-auto" 
          />
        </div>

        {/* Detailed Breakdown */}
        {showDetailedBreakdown && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Compliance Breakdown
            </h4>

            {/* Documentation */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.documentation.status)}
                  <span className="font-medium">Documentation</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {data.ai_analysis.breakdown.documentation.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.documentation.score)}`}>
                    {data.ai_analysis.breakdown.documentation.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.documentation.score} className="h-1.5" />
              <p className="text-sm text-muted-foreground mt-2">
                {data.ai_analysis.breakdown.documentation.notes}
              </p>
            </div>

            {/* Financial */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.financial.status)}
                  <span className="font-medium">Financial</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {data.ai_analysis.breakdown.financial.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.financial.score)}`}>
                    {data.ai_analysis.breakdown.financial.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.financial.score} className="h-1.5" />
              <p className="text-sm text-muted-foreground mt-2">
                {data.ai_analysis.breakdown.financial.notes}
              </p>
            </div>

            {/* Technical */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.ai_analysis.breakdown.technical.status)}
                  <span className="font-medium">Technical</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {data.ai_analysis.breakdown.technical.status}
                  </Badge>
                  <span className={`font-semibold ${getScoreColor(data.ai_analysis.breakdown.technical.score)}`}>
                    {data.ai_analysis.breakdown.technical.score}%
                  </span>
                </div>
              </div>
              <Progress value={data.ai_analysis.breakdown.technical.score} className="h-1.5" />
              <p className="text-sm text-muted-foreground mt-2">
                {data.ai_analysis.breakdown.technical.notes}
              </p>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {data.ai_analysis.total_score >= 80 ? (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Bid Eligible</p>
              <p className="text-sm text-emerald-700 mt-1">
                Your compliance score meets the minimum requirements. You can proceed with bid submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Action Required</p>
              <p className="text-sm text-amber-700 mt-1">
                Your compliance score is below the minimum threshold. Please update your documentation and improve financial indicators before submitting.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
