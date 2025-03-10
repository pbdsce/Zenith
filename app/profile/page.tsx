"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Save,
  LogOut,
  Edit2,
  User,
  Mail,
  Code,
  Shield,
  Database,
  Award,
  FileText,
  LinkIcon,
  Github,
  Linkedin,
  Calendar,
  School,
  ImageIcon,
  Download,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// For demo purposes, we'll use the first profile from the data
import { profiles } from "@/lib/data"
import type { Profile } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Profile>(profiles[0])
  const [formData, setFormData] = useState<Profile>(profiles[0])
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
      // Store filename in formData
      setFormData(prev => ({
        ...prev,
        resumeFileName: e.target.files[0].name
      }))
    }
  }

  const handleSave = () => {
    // Include resumeFile handling if needed in a real app
    setProfile(formData)
    setIsEditing(false)
  }

  const handleDownload = () => {
    // In a real app, this would download the resume file
    // For now, we'll just log it
    console.log("Downloading resume:", profile.resumeFileName)
    // Could redirect to the resumeLink if available
    if (profile.resumeLink) {
      window.open(profile.resumeLink, '_blank')
    }
  }

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10 md:pb-20">
      <div className="container mx-auto py-6 px-4 md:py-10 md:px-8 lg:px-16 xl:px-32">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors mb-4 sm:mb-0">
            ← Back to Home
          </Link>

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#0ff] hover:bg-[#0ff]/80 text-black w-full sm:w-auto" 
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="border-[#0ff] text-[#0ff] hover:bg-[#0ff]/10 w-full sm:w-auto"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/10 w-full sm:w-auto"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border border-gray-800 max-w-[90vw] w-[400px] mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Your session will be ended and you'll need to login again to access your profile.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-[#ff00ff] text-white hover:bg-[#ff00ff]/80" onClick={handleLogout}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="py-4 px-0 sm:py-6 md:py-8 md:px-4 lg:px-24">
        {/* Profile Header - Simplified without banner */}
        <motion.div
          className="mb-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#0ff]/30 overflow-hidden bg-gray-900 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <img
                src={profile.profilePic || "/placeholder.svg?height=200&width=200"}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {isEditing && (
              <Button
                size="icon"
                className="absolute bottom-0 right-0 bg-[#0ff] hover:bg-[#0ff]/80 text-black rounded-full h-6 w-6 sm:h-8 sm:w-8"
              >
                <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-xl sm:text-2xl font-bold bg-gray-900 border-gray-700 mb-2"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.name}</h1>
            )}

            {isEditing ? (
              <Input
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                className="text-gray-300 bg-gray-900 border-gray-700"
              />
            ) : (
              <p className="text-base sm:text-lg text-gray-300">{profile.college}</p>
            )}
          </div>
        </motion.div>
        
        {/* Profile Content */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 sm:mb-8 bg-gray-900 overflow-x-auto">
            <TabsTrigger value="personal" className="data-[state=active]:bg-[#0ff]/20 data-[state=active]:text-[#0ff] text-xs sm:text-sm">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-[#0ff]/20 data-[state=active]:text-[#0ff] text-xs sm:text-sm">
              Links & Profiles
            </TabsTrigger>
            <TabsTrigger value="bio" className="data-[state=active]:bg-[#0ff]/20 data-[state=active]:text-[#0ff] text-xs sm:text-sm">
              Bio & Resume
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-[#0ff] text-lg sm:text-xl">Personal Information</CardTitle>
                <CardDescription className="text-sm">Your basic information that will be displayed on your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#0ff]" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={isEditing ? formData.name : profile.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#0ff]" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={isEditing ? formData.email : profile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0ff]" />
                      Age
                    </Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={isEditing ? formData.age : profile.age}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college" className="flex items-center gap-2">
                      <School className="h-4 w-4 text-[#0ff]" />
                      College/University
                    </Label>
                    <Input
                      id="college"
                      name="college"
                      value={isEditing ? formData.college : profile.college}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links & Profiles Tab */}
          <TabsContent value="links">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-[#0ff] text-lg sm:text-xl">Links & Professional Profiles</CardTitle>
                <CardDescription className="text-sm">
                  Your social and professional links that will be displayed on your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <h3 className="text-md sm:text-lg font-medium text-white flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-[#0ff]" />
                    Social Links
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="githubLink" className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-[#0ff]" />
                        GitHub Profile
                      </Label>
                      <Input
                        id="githubLink"
                        name="githubLink"
                        value={isEditing ? formData.githubLink || "" : profile.githubLink || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedinLink" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#0ff]" />
                        LinkedIn Profile
                      </Label>
                      <Input
                        id="linkedinLink"
                        name="linkedinLink"
                        value={isEditing ? formData.linkedinLink || "" : profile.linkedinLink || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolioLink" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-[#0ff]" />
                        Portfolio Website
                      </Label>
                      <Input
                        id="portfolioLink"
                        name="portfolioLink"
                        value={isEditing ? formData.portfolioLink || "" : profile.portfolioLink || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-md sm:text-lg font-medium text-white flex items-center gap-2">
                    <Code className="h-4 w-4 text-[#0ff]" />
                    Coding Profiles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="leetcodeProfile" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-[#0ff]" />
                        LeetCode Profile
                      </Label>
                      <Input
                        id="leetcodeProfile"
                        name="leetcodeProfile"
                        value={isEditing ? formData.leetcodeProfile || "" : profile.leetcodeProfile || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://leetcode.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpProfiles" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-[#0ff]" />
                        Competitive Programming Profiles
                      </Label>
                      <Input
                        id="cpProfiles"
                        name="cpProfiles"
                        value={
                          isEditing
                            ? formData.cpProfiles
                              ? formData.cpProfiles.join(", ")
                              : ""
                            : profile.cpProfiles
                              ? profile.cpProfiles.join(", ")
                              : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            cpProfiles: value ? value.split(",").map((v) => v.trim()) : [],
                          }))
                        }}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://codeforces.com/profile/username, https://codechef.com/users/username"
                      />
                      {isEditing && <p className="text-xs text-gray-400 mt-1">Separate multiple links with commas</p>}
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-md sm:text-lg font-medium text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0ff]" />
                    CTF & Other Profiles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="ctfProfileLinks" className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#0ff]" />
                        CTF Profiles
                      </Label>
                      <Input
                        id="ctfProfileLinks"
                        name="ctfProfileLinks"
                        value={
                          isEditing
                            ? formData.ctfProfileLinks
                              ? formData.ctfProfileLinks.join(", ")
                              : ""
                            : profile.ctfProfileLinks
                              ? profile.ctfProfileLinks.join(", ")
                              : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            ctfProfileLinks: value ? value.split(",").map((v) => v.trim()) : [],
                          }))
                        }}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://ctftime.org/user/username, https://hackthebox.eu/profile/username"
                      />
                      {isEditing && <p className="text-xs text-gray-400 mt-1">Separate multiple links with commas</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kaggleLink" className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#0ff]" />
                        Kaggle Profile
                      </Label>
                      <Input
                        id="kaggleLink"
                        name="kaggleLink"
                        value={isEditing ? formData.kaggleLink || "" : profile.kaggleLink || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://kaggle.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="devfolioLink" className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#0ff]" />
                        Devfolio Profile
                      </Label>
                      <Input
                        id="devfolioLink"
                        name="devfolioLink"
                        value={isEditing ? formData.devfolioLink || "" : profile.devfolioLink || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://devfolio.co/@username"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bio & Resume Tab */}
          <TabsContent value="bio">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-[#0ff] text-lg sm:text-xl">Bio & Resume</CardTitle>
                <CardDescription className="text-sm">Your professional summary and resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="shortBio" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0ff]" />
                    Professional Bio
                  </Label>
                  <Textarea
                    id="shortBio"
                    name="shortBio"
                    value={isEditing ? formData.shortBio : profile.shortBio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-700 min-h-[120px]"
                    placeholder="Write a short professional bio (100 words max)"
                  />
                  {isEditing && <p className="text-xs text-gray-400 mt-1">{formData.shortBio.length}/500 characters</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resumeLink" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0ff]" />
                    Resume
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-gray-800 border border-gray-700 rounded-md flex-1 flex items-center px-3 py-2">
                        <span className="text-gray-400 truncate text-sm sm:text-base">
                          {resumeFile ? resumeFile.name : (formData.resumeFileName || "No file selected")}
                        </span>
                      </div>
                      <label htmlFor="resume-upload" className="w-full sm:w-auto">
                        <input 
                          id="resume-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <Button variant="outline" className="border-[#0ff] text-[#0ff] hover:bg-[#0ff]/10 w-full sm:w-auto" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-gray-800 border border-gray-700 rounded-md flex-1 flex items-center px-3 py-2">
                        <FileText className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 truncate text-sm sm:text-base">
                          {profile.resumeFileName || "No resume uploaded"}
                        </span>
                      </div>
                      {profile.resumeFileName && (
                        <Button 
                          variant="outline" 
                          className="border-[#0ff] text-[#0ff] hover:bg-[#0ff]/10 w-full sm:w-auto"
                          onClick={handleDownload}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <p className="text-xs text-gray-400 mt-1">Upload your resume (PDF, DOC, DOCX, max 500KB)</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end gap-2 px-4 py-4 sm:px-6">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#0ff] hover:bg-[#0ff]/80 text-black w-full sm:w-auto" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="border-[#0ff] text-[#0ff] hover:bg-[#0ff]/10 w-full sm:w-auto"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
            </div>
      </div>
    </main>
  )
}

