"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  Loader2,
  Plus,
  X,
  Flag,
  Trophy
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
import { useToast } from "@/hooks/use-toast"

// Auth hooks and utilities
import { useAuth } from "@/hooks/useAuth"
import { getAuthToken } from "@/lib/auth-storage"

// Define user profile structure based on our API
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  college_name?: string;
  bio?: string;
  github_link?: string;
  linkedin_link?: string;
  portfolio_link?: string;
  resume_link?: string;
  profile_picture?: string | null;
  isAdmin?: boolean;
  status?: string;
  ctf_profiles?: Array<{id: string, url: string}>;
  cp_profiles?: Array<{id: string, url: string}>;
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated, logout: authLogout, refreshUser } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [colleges, setColleges] = useState<{ id: string, name: string }[]>([]);
  const [collegeSearchInput, setCollegeSearchInput] = useState("");
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Create a reference for the profile picture input
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  // Add a function to trigger the file input click
  const triggerProfilePictureUpload = () => {
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.click();
    }
  };

  // New state for handling CTF and CP profiles
  const [ctfProfiles, setCtfProfiles] = useState<Array<{id?: string, url: string}>>([])
  const [cpProfiles, setCpProfiles] = useState<Array<{id?: string, url: string}>>([])
  const [newCtfUrl, setNewCtfUrl] = useState('')
  const [newCpUrl, setNewCpUrl] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true)
        const token = getAuthToken()
        
        const response = await fetch(`/api/users/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.status === "success" && data.user) {
          setProfile(data.user)
          setFormData(data.user)
          
          // Initialize the CTF and CP profiles from the fetched data
          setCtfProfiles(data.user.ctf_profiles || [])
          setCpProfiles(data.user.cp_profiles || [])
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to load profile data",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [user, toast])

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        const data = await response.json();
        if (data.status === "success") {
          setColleges(data.colleges);
        } else {
          console.error("Failed to fetch colleges:", data.message);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    };

    fetchColleges();

    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set initial college search input when profile data is loaded
  useEffect(() => {
    if (profile?.college_name) {
      setCollegeSearchInput(profile.college_name);
    }
  }, [profile]);

  // Filter colleges based on search input
  const filteredColleges = collegeSearchInput
    ? colleges.filter(college => 
        college.name.toLowerCase().includes(collegeSearchInput.toLowerCase()))
    : colleges;

  const handleCollegeSelect = (collegeName: string) => {
    setFormData(prev => ({ ...prev, college_name: collegeName }));
    setCollegeSearchInput(collegeName);
    setIsCustomCollege(false);
    setDropdownVisible(false);
  };

  const handleCollegeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCollegeSearchInput(value);
    
    // Update form data with the current input value
    setFormData(prev => ({ ...prev, college_name: value }));
    
    // If the input doesn't match any college exactly, it's potentially a custom college
    const matchingCollege = colleges.find(
      college => college.name.toLowerCase() === value.toLowerCase()
    );
    
    if (!matchingCollege && value.trim()) {
      setIsCustomCollege(true);
    } else {
      setIsCustomCollege(false);
    }
    
    // Show dropdown when typing
    if (value.trim()) {
      setDropdownVisible(true);
    } else {
      setDropdownVisible(false);
    }
  };

  const handleCollegeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed and we have a custom college
    if (e.key === 'Enter' && isCustomCollege && collegeSearchInput.trim()) {
      e.preventDefault(); // Prevent form submission
      
      try {
        // Call the API to add the new college
        const response = await fetch('/api/colleges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: collegeSearchInput.trim() }),
        });
        
        const data = await response.json();
        
        if (data.status === "success") {
          // Update the list of colleges with the new one
          setColleges(prev => [...prev, { 
            id: data.college.id, 
            name: data.college.name 
          }]);
          
          // Set form data with the added college name
          setFormData(prev => ({ ...prev, college_name: data.college.name }));
          setCollegeSearchInput(data.college.name);
          setDropdownVisible(false);
          
          // Show success message
          toast({
            title: "College Added",
            description: "College added successfully to our database",
          });
          
          // College is now from database, no longer custom
          setIsCustomCollege(false);
        } else {
          throw new Error(data.message || "Failed to add college");
        }
      } catch (error) {
        console.error("Error adding college:", error);
        toast({
          title: "Error",
          description: "Failed to add college. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Resume must be less than 1MB",
          variant: "destructive"
        })
        return;
      }
      
      // Validate file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed",
          variant: "destructive"
        })
        return;
      }
      
      setResumeFile(file)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be less than 1MB",
          variant: "destructive"
        })
        return;
      }
      
      // Validate image type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive"
        })
        return;
      }
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicturePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      setProfilePictureFile(file);
    }
  }

  // Functions to handle CTF and CP profiles
  const addCtfProfile = () => {
    if (!newCtfUrl.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a profile URL",
        variant: "destructive"
      })
      return
    }
    
    // Simple URL validation
    try {
      new URL(newCtfUrl)
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive"
      })
      return
    }
    
    const newProfile = {
      url: newCtfUrl.trim()
    }
    
    setCtfProfiles(prev => [...prev, newProfile])
    setNewCtfUrl('')
  }
  
  const removeCtfProfile = (index: number) => {
    setCtfProfiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const addCpProfile = () => {
    if (!newCpUrl.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a profile URL",
        variant: "destructive"
      })
      return
    }
    
    // Simple URL validation
    try {
      new URL(newCpUrl)
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive"
      })
      return
    }
    
    const newProfile = {
      url: newCpUrl.trim()
    }
    
    setCpProfiles(prev => [...prev, newProfile])
    setNewCpUrl('')
  }
  
  const removeCpProfile = (index: number) => {
    setCpProfiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!user || !user.uid) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      })
      return;
    }
    
    try {
      setIsSaving(true)
      
      // Create form data to send
      const formDataToSend = new FormData()
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        // Skip uid and other read-only fields
        if (key !== 'uid' && key !== 'isAdmin' && key !== 'email' && key !== 'name' && 
            key !== 'ctf_profiles' && key !== 'cp_profiles' && value !== undefined) {
          formDataToSend.append(key, String(value))
        }
      })
      
      // Add is_custom_college flag if needed
      if (isCustomCollege && formData.college_name) {
        formDataToSend.append('is_custom_college', 'true');
      } else {
        formDataToSend.append('is_custom_college', 'false');
      }
      
      // Add CTF and CP profiles as JSON strings
      formDataToSend.append('ctf_profiles', JSON.stringify(ctfProfiles))
      formDataToSend.append('cp_profiles', JSON.stringify(cpProfiles))
      
      // Add files if present
      if (resumeFile) {
        formDataToSend.append('resume', resumeFile)
      }
      
      if (profilePictureFile) {
        formDataToSend.append('profile_picture', profilePictureFile)
      }
      
      // Send the update request
      const token = getAuthToken()
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })
      
      const data = await response.json()
      
      if (data.status === "success") {
        // Refresh user data in context
        await refreshUser()
        
        // Also refetch profile data to ensure UI is updated
        const getResponse = await fetch(`/api/users/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const getUserData = await getResponse.json()
        
        if (getUserData.status === "success") {
          setProfile(getUserData.user)
          setCtfProfiles(getUserData.user.ctf_profiles || [])
          setCpProfiles(getUserData.user.cp_profiles || [])
        }
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        
        // Reset file inputs
        setResumeFile(null)
        setProfilePictureFile(null)
        setIsEditing(false)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (profile?.resume_link) {
      window.open(profile.resume_link, '_blank')
    }
  }

  const handleLogout = () => {
    authLogout()
    router.push("/login")
  }

  // Show loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0ff]" />
          <p className="text-lg text-gray-300">Loading your profile...</p>
        </div>
      </div>
    )
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
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#0ff] hover:bg-[#0ff]/80 text-black w-full sm:w-auto" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
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
                    Your session will be ended and you&apos;ll need to login again to access your profile.
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
                src={
                  profilePicturePreview || 
                  profile.profile_picture || 
                  "/placeholder.svg?height=200&width=200"
                }
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {isEditing && (
              <>
                <input
                  ref={profilePictureInputRef}
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={isSaving}
                />
                {/* Replace the Button with a div to improve clickability */}
                <div
                  className="absolute bottom-0 right-0 bg-[#0ff] hover:bg-[#0ff]/80 text-black rounded-full h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center cursor-pointer"
                  onClick={triggerProfilePictureUpload}
                >
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                {/* Add an explicit text link below profile picture for better visibility */}
                <div className="mt-2 text-center w-full">
                  <span 
                    onClick={triggerProfilePictureUpload}
                    className="text-xs text-[#0ff] underline cursor-pointer"
                  >
              
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {profile.name}
              {profile.isAdmin && (
                <span className="ml-2 inline-block bg-[#ff00ff]/20 text-[#ff00ff] text-xs px-2 py-1 rounded">
                  ADMIN
                </span>
              )}
            </h1>
            <p className="text-base sm:text-lg text-gray-300">
              {isEditing ? (
                <Input
                  name="college_name"
                  value={formData.college_name || ""}
                  onChange={handleInputChange}
                  className="mt-2 text-gray-300 bg-gray-900 border-gray-700"
                  placeholder="Your college/university"
                  disabled={isSaving}
                />
              ) : (
                profile.college_name || "No college/university added"
              )}
            </p>
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
                      value={profile.name}
                      disabled={true}
                      className="bg-gray-800 border-gray-700 opacity-70"
                    />
                    {isEditing && (
                      <p className="text-xs text-gray-400">Name cannot be changed</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#0ff]" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={profile.email}
                      disabled={true}
                      className="bg-gray-800 border-gray-700 opacity-70"
                    />
                    {isEditing && (
                      <p className="text-xs text-gray-400">Email cannot be changed</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college_name" className="flex items-center gap-2">
                      <School className="h-4 w-4 text-[#0ff]" />
                      College/University
                    </Label>
                    {isEditing ? (
                      <div ref={collegeDropdownRef} className="relative">
                        <Input
                          id="college_name"
                          name="college_name"
                          value={collegeSearchInput}
                          onChange={handleCollegeInputChange}
                          onKeyDown={handleCollegeKeyDown}
                          onFocus={() => collegeSearchInput && setDropdownVisible(true)}
                          disabled={isSaving}
                          className="bg-gray-800 border-gray-700"
                          placeholder="Search or enter your college"
                        />
                        
                        {dropdownVisible && (
                          <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredColleges.length > 0 ? (
                              filteredColleges.map((college) => (
                                <div 
                                  key={college.id} 
                                  className="px-4 py-2 hover:bg-gray-800 cursor-pointer"
                                  onClick={() => handleCollegeSelect(college.name)}
                                >
                                  {college.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-400">
                                {collegeSearchInput ? (
                                  <>
                                    <p>&quot;{collegeSearchInput}&quot; not found</p>
                                    <p className="text-xs mt-1 text-gray-500">Press Enter to add this college</p>
                                  </>
                                ) : (
                                  "No colleges found"
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {isCustomCollege && collegeSearchInput && (
                          <div className="mt-1 text-xs text-amber-400">
                            &quot;{collegeSearchInput}&quot; will be added to our database
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        id="college_name"
                        value={profile.college_name || ""}
                        disabled={true}
                        className="bg-gray-800 border-gray-700"
                        placeholder="No college/university added"
                      />
                    )}
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
                      <Label htmlFor="github_link" className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-[#0ff]" />
                        GitHub Profile
                      </Label>
                      <Input
                        id="github_link"
                        name="github_link"
                        value={isEditing ? formData.github_link || "" : profile.github_link || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || isSaving}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_link" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#0ff]" />
                        LinkedIn Profile
                      </Label>
                      <Input
                        id="linkedin_link"
                        name="linkedin_link"
                        value={isEditing ? formData.linkedin_link || "" : profile.linkedin_link || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || isSaving}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio_link" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-[#0ff]" />
                        Portfolio Website
                      </Label>
                      <Input
                        id="portfolio_link"
                        name="portfolio_link"
                        value={isEditing ? formData.portfolio_link || "" : profile.portfolio_link || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || isSaving}
                        className="bg-gray-800 border-gray-700"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  {/* CTF Profiles Section */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-md sm:text-lg font-medium text-white flex items-center gap-2 mb-4">
                      <Flag className="h-4 w-4 text-[#0ff]" />
                      CTF Profiles
                    </h3>
                    
                    {/* Display existing CTF profiles */}
                    {!isEditing ? (
                      <div className="space-y-3">
                        {ctfProfiles && ctfProfiles.length > 0 ? (
                          ctfProfiles.map((profile, index) => (
                            <div key={profile.id || index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                              <Flag className="h-4 w-4 text-[#0ff]" />
                              <a 
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0ff] hover:underline text-sm truncate flex-1"
                              >
                                {profile.url}
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No CTF profiles added</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Edit mode: Show existing profiles with remove buttons */}
                        {ctfProfiles && ctfProfiles.map((profile, index) => (
                          <div key={profile.id || index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                            <Flag className="h-4 w-4 flex-shrink-0 text-[#0ff]" />
                            <span className="text-sm text-gray-300 truncate flex-1">{profile.url}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCtfProfile(index)}
                              disabled={isSaving}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Form to add new profiles */}
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Profile URL (e.g., https://hackthebox.com/profile/...)"
                            value={newCtfUrl}
                            onChange={(e) => setNewCtfUrl(e.target.value)}
                            disabled={isSaving}
                            className="bg-gray-800 border-gray-700 flex-1"
                          />
                          <Button
                            onClick={addCtfProfile}
                            disabled={isSaving || !newCtfUrl}
                            className="bg-[#0ff]/20 hover:bg-[#0ff]/30 text-[#0ff] px-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CP Profiles Section */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-md sm:text-lg font-medium text-white flex items-center gap-2 mb-4">
                      <Trophy className="h-4 w-4 text-[#0ff]" />
                      Competitive Programming Profiles
                    </h3>
                    
                    {/* Display existing CP profiles */}
                    {!isEditing ? (
                      <div className="space-y-3">
                        {cpProfiles && cpProfiles.length > 0 ? (
                          cpProfiles.map((profile, index) => (
                            <div key={profile.id || index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                              <Trophy className="h-4 w-4 text-[#0ff]" />
                              <a 
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0ff] hover:underline text-sm truncate flex-1"
                              >
                                {profile.url}
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No competitive programming profiles added</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Edit mode: Show existing profiles with remove buttons */}
                        {cpProfiles && cpProfiles.map((profile, index) => (
                          <div key={profile.id || index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-md">
                            <Trophy className="h-4 w-4 flex-shrink-0 text-[#0ff]" />
                            <span className="text-sm text-gray-300 truncate flex-1">{profile.url}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCpProfile(index)}
                              disabled={isSaving}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Form to add new profiles */}
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Profile URL (e.g., https://codeforces.com/profile/...)"
                            value={newCpUrl}
                            onChange={(e) => setNewCpUrl(e.target.value)}
                            disabled={isSaving}
                            className="bg-gray-800 border-gray-700 flex-1"
                          />
                          <Button
                            onClick={addCpProfile}
                            disabled={isSaving || !newCpUrl}
                            className="bg-[#0ff]/20 hover:bg-[#0ff]/30 text-[#0ff] px-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0ff]" />
                    Professional Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={isEditing ? formData.bio || "" : profile.bio || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing || isSaving}
                    className="bg-gray-800 border-gray-700 min-h-[120px]"
                    placeholder="Write a short professional bio (500 characters max)"
                    maxLength={500}
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-400 mt-1">
                      {(formData.bio?.length || 0)}/500 characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0ff]" />
                    Resume
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-gray-800 border border-gray-700 rounded-md flex-1 flex items-center px-3 py-2">
                        <span className="text-gray-400 truncate text-sm sm:text-base">
                          {resumeFile ? 
                            resumeFile.name : 
                            (profile.resume_link ? "Current resume on file (PDF)" : "No file selected")}
                        </span>
                      </div>
                      <label htmlFor="resume-upload" className="w-full sm:w-auto">
                        <input 
                          id="resume-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf"
                          onChange={handleResumeChange}
                          disabled={isSaving}
                        />
                        <Button 
                          variant="outline" 
                          className="border-[#0ff] text-[#0ff] hover:bg-[#0ff]/10 w-full sm:w-auto" 
                          asChild
                          disabled={isSaving}
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload PDF
                          </span>
                        </Button>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="bg-gray-800 border border-gray-700 rounded-md flex-1 flex items-center px-3 py-2">
                        <FileText className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 truncate text-sm sm:text-base">
                          {profile.resume_link ? "Resume available (PDF)" : "No resume uploaded"}
                        </span>
                      </div>
                      {profile.resume_link && (
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
                    <p className="text-xs text-gray-400 mt-1">Upload your resume (PDF only, max 1MB)</p>
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
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-[#0ff] hover:bg-[#0ff]/80 text-black w-full sm:w-auto" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
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

