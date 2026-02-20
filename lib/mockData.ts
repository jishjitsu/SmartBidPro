// Mock Data for SmartBid PRO - Simulates AI Analysis and System Data

export interface ComplianceAnalysis {
  status: "success" | "processing" | "failed"
  ai_analysis: {
    total_score: number
    risk_level: "Low" | "Medium" | "High"
    breakdown: {
      documentation: {
        score: number
        status: "Excellent" | "Good" | "Pass" | "Needs Improvement" | "Fail"
        notes: string
      }
      financial: {
        score: number
        status: "Excellent" | "Good" | "Pass" | "Needs Improvement" | "Fail"
        notes: string
      }
      technical: {
        score: number
        status: "Excellent" | "Good" | "Pass" | "Needs Improvement" | "Fail"
        notes: string
      }
    }
  }
}

export interface BidData {
  id: string
  bidder_name: string
  bidder_company: string
  bid_amount: number
  compliance_score: number
  risk_level: "Low" | "Medium" | "High"
  submitted_at: string
  status: "Pending" | "Accepted" | "Rejected"
}

// Mock compliance responses for different scenarios
export const getMockComplianceResponse = (score?: number): ComplianceAnalysis => {
  const baseScore = score || Math.floor(Math.random() * 30) + 70 // Random between 70-100
  
  const documentation = baseScore + Math.floor(Math.random() * 10) - 5
  const financial = baseScore + Math.floor(Math.random() * 10) - 5
  const technical = baseScore + Math.floor(Math.random() * 10) - 5
  
  const getStatus = (s: number) => {
    if (s >= 90) return "Excellent"
    if (s >= 80) return "Good"
    if (s >= 70) return "Pass"
    if (s >= 60) return "Needs Improvement"
    return "Fail"
  }
  
  const getRiskLevel = (s: number): "Low" | "Medium" | "High" => {
    if (s >= 85) return "Low"
    if (s >= 70) return "Medium"
    return "High"
  }
  
  return {
    status: "success",
    ai_analysis: {
      total_score: Math.round((documentation + financial + technical) / 3),
      risk_level: getRiskLevel(baseScore),
      breakdown: {
        documentation: {
          score: documentation,
          status: getStatus(documentation),
          notes: documentation >= 90 
            ? "All certifications valid until 2026. Complete documentation package."
            : documentation >= 80
            ? "All required documents present. Minor formatting issues noted."
            : "Some documents require updates. Review insurance certificates."
        },
        financial: {
          score: financial,
          status: getStatus(financial),
          notes: financial >= 90
            ? "Excellent financial standing. Strong liquidity and credit rating."
            : financial >= 80
            ? "Good financial health. Liquidity ratio slightly below optimal range."
            : "Financial reserves need strengthening. Review cash flow statements."
        },
        technical: {
          score: technical,
          status: getStatus(technical),
          notes: technical >= 90
            ? "Exceptional track record. Previous projects exceed tender scope."
            : technical >= 80
            ? "Good technical capability. Previous project experience matches tender scope."
            : "Limited experience in this category. Additional certifications recommended."
        }
      }
    }
  }
}

// Mock tender requirements generator (simulates AI writing)
export const generateMockRequirements = (category: string = "general"): string => {
  const templates: Record<string, string> = {
    construction: `TENDER REQUIREMENTS - CONSTRUCTION PROJECT

1. TECHNICAL QUALIFICATIONS
   1.1 The bidder must possess valid Class A contractor license
   1.2 Minimum 5 years experience in commercial construction
   1.3 ISO 9001:2015 certification for quality management
   1.4 Safety record with OSHA compliance for past 3 years

2. FINANCIAL REQUIREMENTS
   2.1 Audited financial statements for last 3 fiscal years
   2.2 Minimum net worth of $5,000,000
   2.3 Line of credit or bonding capacity of at least 150% of bid amount
   2.4 Professional liability insurance: $2,000,000 minimum coverage

3. TECHNICAL CAPABILITIES
   3.1 Project management team with PMP certification
   3.2 In-house engineering capabilities or partnership agreements
   3.3 Equipment inventory suitable for project scale
   3.4 Quality control procedures and documentation system

4. COMPLIANCE DOCUMENTATION
   4.1 Business registration and tax clearance certificates
   4.2 Environmental compliance certifications
   4.3 Worker's compensation insurance
   4.4 Performance bond and payment bond capacity`,

    it_services: `TENDER REQUIREMENTS - IT SERVICES PROJECT

1. TECHNICAL QUALIFICATIONS
   1.1 ISO 27001 Information Security certification
   1.2 Minimum 3 years experience in enterprise IT solutions
   1.3 Certified professionals (Microsoft, AWS, or equivalent)
   1.4 Data protection and GDPR compliance certification

2. FINANCIAL REQUIREMENTS
   2.1 Annual revenue of at least $1,000,000
   2.2 Professional indemnity insurance: $1,000,000 coverage
   2.3 Cyber liability insurance
   2.4 Financial stability proof (bank statements or credit rating)

3. TECHNICAL CAPABILITIES
   3.1 24/7 support infrastructure and SLA guarantees
   3.2 Disaster recovery and business continuity plans
   3.3 Cloud infrastructure certifications
   3.4 Portfolio of similar projects with client references

4. COMPLIANCE DOCUMENTATION
   4.1 Security clearance for personnel (if applicable)
   4.2 Non-disclosure and confidentiality agreements
   4.3 Intellectual property rights documentation
   4.4 Data handling and privacy policy documentation`,

    general: `TENDER REQUIREMENTS - GENERAL PROCUREMENT

1. TECHNICAL QUALIFICATIONS
   1.1 Valid business license and registration
   1.2 Minimum 2 years operation in relevant industry
   1.3 Quality certifications (ISO or equivalent)
   1.4 Health and safety compliance record

2. FINANCIAL REQUIREMENTS
   2.1 Financial statements for last 2 years
   2.2 Proof of financial stability
   2.3 Adequate insurance coverage
   2.4 Tax compliance certificates

3. TECHNICAL CAPABILITIES
   3.1 Demonstrated capacity to deliver
   3.2 Qualified personnel and resources
   3.3 Quality assurance procedures
   3.4 Client references and past performance

4. COMPLIANCE DOCUMENTATION
   4.1 Corporate governance documents
   4.2 Environmental and social compliance
   4.3 Anti-corruption and ethics policy
   4.4 Legal compliance certifications`
  }
  
  return templates[category] || templates.general
}

// Mock bidder data for Admin monitoring view
export const getMockBidders = (tenderId: string, count: number = 5): BidData[] => {
  const companies = [
    "BuildTech Solutions Ltd",
    "Premier Construction Co",
    "Global Infrastructure Partners",
    "Summit Engineering Group",
    "NextGen Contractors",
    "Apex Development Corp",
    "Horizon Builders Inc",
    "Innovate Construction"
  ]
  
  const names = [
    "John Smith", "Sarah Johnson", "Michael Chen", 
    "Emily Rodriguez", "David Park", "Lisa Anderson",
    "James Wilson", "Maria Garcia"
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const score = Math.floor(Math.random() * 30) + 70
    return {
      id: `bid_${tenderId}_${i + 1}`,
      bidder_name: names[i % names.length],
      bidder_company: companies[i % companies.length],
      bid_amount: Math.floor(Math.random() * 500000) + 100000,
      compliance_score: score,
      risk_level: score >= 85 ? "Low" : score >= 70 ? "Medium" : "High",
      submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "Pending"
    }
  })
}

// Admin dashboard stats
export const getAdminStats = (auctions: any[]) => {
  const totalBids = auctions.reduce((acc, auction) => {
    return acc + (auction.bid_count || Math.floor(Math.random() * 8) + 2)
  }, 0)

  const avgCompliance = Math.floor(Math.random() * 10) + 82
  const totalValue = auctions.reduce((acc, a) => acc + (a.minimum_bid || 0), 0)

  return {
    totalTenders: auctions.length,
    activeBids: totalBids,
    avgComplianceScore: avgCompliance,
    tendersAwarded: auctions.filter(a => a.status === "Awarded").length,
    totalValue,
    userGrowth: Math.floor(Math.random() * 15) + 8,
  }
}

// Vendor dashboard stats (legacy)
export const getVendorStats = () => {
  return {
    activeBids: Math.floor(Math.random() * 5) + 2,
    wonBids: Math.floor(Math.random() * 3) + 1,
    winRate: Math.floor(Math.random() * 30) + 40,
    avgComplianceScore: Math.floor(Math.random() * 15) + 80
  }
}

// Vendor profile / registration-readiness stats
export const getVendorProfileStats = () => {
  const docsCompliant = Math.floor(Math.random() * 2) + 6
  const verifiedCats = Math.floor(Math.random() * 3) + 3
  return {
    profileStrength: Math.floor(Math.random() * 20) + 72,
    verifiedCategories: verifiedCats,
    totalCategories: 8,
    activeApplications: Math.floor(Math.random() * 4) + 1,
    profileViews: Math.floor(Math.random() * 40) + 20,
    documentsCompliant: docsCompliant,
    totalDocuments: 9,
    missingDocs: ["Insurance Certificate", "Tax Clearance"].slice(0, 9 - docsCompliant),
  }
}

// Bidder action/competition stats
export const getBidderStats = () => {
  return {
    activeBids: Math.floor(Math.random() * 5) + 2,
    winRate: Math.floor(Math.random() * 30) + 40,
    pendingClarifications: Math.floor(Math.random() * 2) + 1, // Always 1 or 2
    bidsDueThisWeek: Math.floor(Math.random() * 2) + 1,
    draftBids: Math.floor(Math.random() * 2) + 1,
    avgComplianceScore: Math.floor(Math.random() * 15) + 78,
  }
}

// Admin activity feed
export interface ActivityItem {
  id: string
  type: "bid" | "registration" | "award" | "alert" | "compliance"
  message: string
  actor: string
  timestamp: string
  severity: "info" | "success" | "warning"
}

export const getActivityFeed = (): ActivityItem[] => {
  const raw: Omit<ActivityItem, "id" | "timestamp">[] = [
    { type: "bid", message: "New bid submitted on Tender #T-2204", actor: "TechCorp Solutions", severity: "info" },
    { type: "registration", message: "New vendor registration pending review", actor: "BuildRight Ltd", severity: "success" },
    { type: "compliance", message: "Insurance certificate expired", actor: "Apex Builders", severity: "warning" },
    { type: "award", message: "Tender T-2198 awarded successfully", actor: "Admin", severity: "success" },
    { type: "bid", message: "Bid amount revised upward", actor: "Global IT Partners", severity: "info" },
    { type: "alert", message: "Tender deadline in 48 hours", actor: "System", severity: "warning" },
    { type: "compliance", message: "Compliance score updated to 91%", actor: "Summit Engineering", severity: "success" },
  ]
  return raw.map((a, i) => ({
    ...a,
    id: `act_${i}`,
    timestamp: new Date(Date.now() - i * 23 * 60 * 1000).toISOString(),
  }))
}

// Simulate AI processing delay
export const simulateAIProcessing = (minDelay = 2000, maxDelay = 3500): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay
  return new Promise(resolve => setTimeout(resolve, delay))
}
