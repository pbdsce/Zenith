"use client";

import SearchBar from "../../components/ui/search-bar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CatIcon, Search } from "lucide-react";
import ProfileCard from "../../components/ui/profile-card";
import ProfileModal from "../../components/ui/profile-modal";
import { profiles as initialProfiles } from "@/lib/data";
import type { Profile } from "@/lib/types";
import CountdownTimer from "@/components/ui/countdown-timer";
import Link from "next/link";
import NavButtons from "@/components/navbar";

export default function Participants() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "upvotes">("name");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotedProfiles, setUpvotedProfiles] = useState<Set<string>>(new Set());
  const [pendingUpvotes, setPendingUpvotes] = useState<Set<string>>(new Set());
  const [pendingDownvotes, setPendingDownvotes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profiles from the API
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/users");
        const data = await response.json();

        if (data.status === "success") {
          // Transform user data to match Profile type
          const transformedProfiles: Profile[] = data.users.map(
            (user: any) => ({
              id: user.uid,
              name: user.name,
              college: user.college_name || "Unknown",
              email: user.email,
              phone: user.phone || "N/A",
              resumeLink: user.resume_link || "#",
              shortBio: user.bio, // Default value since it's not in the API
              upvotes: user.upVote || 0, // Default value
              profile_picture: user.profile_picture || CatIcon
              // Add any other required fields with default values
            })
          );

          setProfiles(transformedProfiles);
          
          // Load current user's upvoted profiles if authenticated
          if (isAuthenticated && user) {
            fetchUserUpvotedProfiles();
          }
        } else {
          setError(data.message || "Failed to fetch profiles");
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setError("Failed to load profiles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [isAuthenticated, user]);
  
  // Fetch the user's previously upvoted profiles
  const fetchUserUpvotedProfiles = async () => {
    if (!user || !user.uid) return;
    
    try {
      // Get token from zenith_auth_data in localStorage
      let token = '';
      const authDataStr = localStorage.getItem('zenith_auth_data');
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          token = authData.token || '';
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }
      
      const response = await fetch(`/api/users/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.status === "success" && data.user) {
        const upvotedByUser = data.user.upvotedProfiles || [];
        setUpvotedProfiles(new Set(upvotedByUser));
      }
    } catch (err) {
      console.error("Error loading user's upvoted profiles:", err);
    }
  };

  // Sync upvotes when leaving the page
  useEffect(() => {
    // Function to sync upvotes with the server
    const syncUpvotes = async () => {
      if (!isAuthenticated || !user || (!pendingUpvotes.size && !pendingDownvotes.size)) {
        return;
      }
      
      try {
        // Get token from zenith_auth_data in localStorage
        let token = '';
        const authDataStr = localStorage.getItem('zenith_auth_data');
        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            token = authData.token || '';
          } catch (e) {
            console.error('Failed to parse auth data:', e);
          }
        }
        
        await fetch('/api/users/sync-upvotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.uid,
            upvotes: Array.from(pendingUpvotes),
            downvotes: Array.from(pendingDownvotes),
          }),
        });
        
        // Clear pending changes after successful sync
        setPendingUpvotes(new Set());
        setPendingDownvotes(new Set());
      } catch (err) {
        console.error("Failed to sync upvotes:", err);
      }
    };

    // Sync when component unmounts or on page unload
    window.addEventListener('beforeunload', syncUpvotes);
    
    // Cleanup function that runs when component unmounts
    return () => {
      window.removeEventListener('beforeunload', syncUpvotes);
      syncUpvotes(); // Sync when navigating away within the app
    };
  }, [isAuthenticated, user, pendingUpvotes, pendingDownvotes]);

  // Handle upvoting
  const handleUpvote = (id: string) => {
    if (!isAuthenticated || !user) {
      // Show login prompt
      alert("Please log in to upvote profiles");
      return;
    }

    setProfiles((prevProfiles) => {
      return prevProfiles.map((profile) => {
        if (profile.id === id) {
          const newUpvotes = upvotedProfiles.has(id)
            ? profile.upvotes - 1
            : profile.upvotes + 1;
          return { ...profile, upvotes: newUpvotes };
        }
        return profile;
      });
    });

    setUpvotedProfiles((prev) => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        // User is removing an upvote
        newSet.delete(id);
        
        // Track for backend sync
        setPendingDownvotes(prev => {
          const newDownvotes = new Set(prev);
          newDownvotes.add(id);
          return newDownvotes;
        });
        
        // Remove from pending upvotes if it was just added
        setPendingUpvotes(prev => {
          const newUpvotes = new Set(prev);
          newUpvotes.delete(id);
          return newUpvotes;
        });
      } else {
        // User is adding an upvote
        newSet.add(id);
        
        // Track for backend sync
        setPendingUpvotes(prev => {
          const newUpvotes = new Set(prev);
          newUpvotes.add(id);
          return newUpvotes;
        });
        
        // Remove from pending downvotes if it was previously removed
        setPendingDownvotes(prev => {
          const newDownvotes = new Set(prev);
          newDownvotes.delete(id);
          return newDownvotes;
        });
      }
            
      return newSet;
    });
  };

  // Filter and sort profiles
  useEffect(() => {
    let result = [...profiles];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (profile) =>
          (profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (profile.college?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (profile.shortBio?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }

    // Sort profiles
    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || '').localeCompare(b.name || '');
      } else {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
    });

    setFilteredProfiles(result);
  }, [searchTerm, sortBy, profiles]);

  // Handle profile selection
  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-black text-white relative">
      <div className="fixed top-4 w-full px-4 flex justify-between z-50">
        <div className="ml-4 sm:ml-6">
          <CountdownTimer />
        </div>
        <NavButtons disableFixedPositioning={true} />
      </div>
      
      {/* Add padding-top to account for fixed navbar */}
      <div className="container mx-auto pt-24 px-4">
        {/* Header */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-3 mt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[#0ff] drop-shadow-[0_0_10px_rgba(0,255,255,0.7)]">
            Dev
          </span>
          <span className="text-white">Profiles</span>
        </motion.h1>
        <motion.p
          className="text-xl text-center mb-10 text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Are you getting selected? Probably not lol.
        </motion.p>

        

        {/* Search and Filter */}
        <div className="mt-2 mb-8">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0ff] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-400">Loading profiles...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Error:</div>
            <p>{error}</p>
          </div>
        )}

        {/* Profile Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pb-10">
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onSelect={() => handleProfileSelect(profile)}
                upvoteProfile={handleUpvote}
                hasUpvoted={upvotedProfiles.has(profile.id)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredProfiles.length === 0 && (
          <div className="text-center mt-10 py-16 text-gray-400">
            <Search className="mx-auto h-12 w-12 mb-4 text-[#ff00ff]" />
            <p className="text-xl">
              No profiles found matching your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        profile={selectedProfile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
