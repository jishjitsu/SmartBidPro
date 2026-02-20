"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Shield, Bell, CheckCircle2, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "verification" | "notifications">("profile")

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-800" />
          <h1 className="text-xl font-semibold text-white">Vendor Settings</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeTab === "profile" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4 mr-3" />
              Company Profile
            </Button>
            <Button
              variant={activeTab === "verification" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeTab === "verification" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
              onClick={() => setActiveTab("verification")}
            >
              <Shield className="h-4 w-4 mr-3" />
              Verification
            </Button>
            <Button
              variant={activeTab === "notifications" ? "secondary" : "ghost"}
              className={`w-full justify-start ${activeTab === "notifications" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-4 w-4 mr-3" />
              Notifications
            </Button>
          </aside>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Company Profile</h2>
                  <p className="text-slate-400">Manage your company information and public profile.</p>
                </div>
                <Separator className="bg-slate-800" />
                
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Basic Information</CardTitle>
                    <CardDescription className="text-slate-500">Updating your company details helps us match you with relevant tenders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-300">Company Name</label>
                      <Input placeholder="Enter company name" className="bg-slate-950 border-slate-700 text-slate-200" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-300">Business Registration Number</label>
                      <Input placeholder="Enter registration number" className="bg-slate-950 border-slate-700 text-slate-200" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-300">Description</label>
                      <Textarea placeholder="Describe your business activities..." className="bg-slate-950 border-slate-700 text-slate-200 min-h-[100px]" />
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white w-fit mt-2">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "verification" && (
              <div className="space-y-6">
                 <div>
                  <h2 className="text-2xl font-bold text-white">Verification Status</h2>
                  <p className="text-slate-400">Complete verification to unlock higher value tenders.</p>
                </div>
                <Separator className="bg-slate-800" />

                <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-500/10 p-3 rounded-full text-amber-500 shrink-0">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">Verification Pending</h3>
                        <p className="text-slate-400 mt-1 mb-4">You need to upload business licenses and tax documents to complete verification.</p>
                        <Button className="bg-amber-600 hover:bg-amber-500 text-white">
                          Start Verification
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                       <span className="text-slate-300">GST Registration</span>
                       <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white">Upload</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                       <span className="text-slate-300">PAN Card</span>
                       <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white">Upload</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "notifications" && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
                        <p className="text-slate-400">Manage how you receive alerts and updates.</p>
                    </div>
                    <Separator className="bg-slate-800" />
                    
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-white">Email Alerts</label>
                                    <p className="text-sm text-slate-500">Receive emails about new tenders matching your profile.</p>
                                </div>
                                <div className="h-6 w-11 rounded-full bg-indigo-600 relative cursor-pointer">
                                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                                </div>
                            </div>
                             <Separator className="bg-slate-800" />
                             <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-white">Bid Status Updates</label>
                                    <p className="text-sm text-slate-500">Get notified when your bid status changes.</p>
                                </div>
                                <div className="h-6 w-11 rounded-full bg-indigo-600 relative cursor-pointer">
                                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
