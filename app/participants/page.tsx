"use client";

import SearchBar from "../../components/ui/search-bar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CatIcon, Search } from "lucide-react";
import ProfileCard from "../../components/ui/profile-card";
import ProfileModal from "../../components/ui/profile-modal";
import { profiles as initialProfiles } from "@/lib/data";
import type { Profile } from "@/lib/types";
import CountdownTimer from "@/components/ui/countdown-timer";
import Link from "next/link";
import NavButtons from "@/components/navbar";
import { analytics, logEvent } from "@/Firebase";

export default function Participants() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "upvotes">("name");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotedProfiles, setUpvotedProfiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize fetch functions to prevent recreations on each render
  const fetchUserUpvotedProfiles = useCallback(async () => {
    if (!user || !user.uid || !isAuthenticated) return;
    
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

      if (analytics) {
        logEvent(analytics, "fetch_upvoted_profiles_error", {
          user_id: user.uid,
          error: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, [user, isAuthenticated]);

  // Main data fetching - consolidate API calls
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;
    
    const fetchData = async () => {
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
              shortBio: user.bio,
              upvotes: user.upVote || 0,
              profile_picture: user.profile_picture || CatIcon,
              // Additional fields
              leetcode_profile: user.leetcode_profile || null,
              github_link: user.github_link || null,
              linkedin_link: user.linkedin_link || null,
              competitive_profile: user.competitive_profile || null,
              ctf_profile: user.ctf_profile || null,
              kaggle_link: user.kaggle_link || null,
              devfolio_link: user.devfolio_link || null,
              portfolio_link: user.portfolio_link || null,
              status: user.status || "pending"
            })
          );

          setProfiles(transformedProfiles);
          
          // Also fetch upvoted profiles if authenticated
          if (isAuthenticated && user) {
            await fetchUserUpvotedProfiles();
          }

          // Log page view event
          if (analytics) {
            logEvent(analytics, "page_view", {
              page_title: "Participants",
              page_path: "/participants",
              user_id: user?.uid || "anonymous",
            });
          }
        } else {
          setError(data.message || "Failed to fetch profiles");
          if (analytics) {
            logEvent(analytics, "fetch_profiles_error", {
              error: data.message || "Unknown error",
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setError("Failed to load profiles. Please try again later.");
        if (analytics) {
          logEvent(analytics, "fetch_profiles_error", {
            error: err instanceof Error ? err.message : "Unknown error",
            timestamp: new Date().toISOString(),
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Only re-run when auth state changes or when fetchUserUpvotedProfiles changes
    // (which only happens when user or isAuthenticated changes)
  }, [isAuthenticated, user, authLoading, fetchUserUpvotedProfiles]);
  
  // Handle upvoting - simplified to make immediate API calls
  const handleUpvote = async (id: string) => {
    if (!isAuthenticated || !user) {
      // Show login prompt
      alert("Please log in to upvote profiles");
      if (analytics) {
        logEvent(analytics, "upvote_attempt_unauthenticated", {
          profile_id: id,
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }

    try {
      // Determine whether this is an upvote or downvote action
      const isUpvoted = upvotedProfiles.has(id);

      // Update UI immediately for better user experience
      setProfiles((prevProfiles) => {
        return prevProfiles.map((profile) => {
          if (profile.id === id) {
            const newUpvotes = isUpvoted
              ? profile.upvotes - 1
              : profile.upvotes + 1;
            return { ...profile, upvotes: newUpvotes };
          }
          return profile;
        });
      });

      setUpvotedProfiles((prev) => {
        const newSet = new Set(prev);
        if (isUpvoted) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });

      // Get token from localStorage
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

      // Make immediate API call to the correct endpoint
      const response = await fetch(`/api/users/${id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });

      const data = await response.json();
      
      if (data.status !== "success") {
        // Revert UI changes if API call fails
        setProfiles((prevProfiles) => {
          return prevProfiles.map((profile) => {
            if (profile.id === id) {
              const newUpvotes = isUpvoted
                ? profile.upvotes + 1  // Revert the decrease
                : profile.upvotes - 1;  // Revert the increase
              return { ...profile, upvotes: newUpvotes };
            }
            return profile;
          });
        });

        setUpvotedProfiles((prev) => {
          const newSet = new Set(prev);
          if (isUpvoted) {
            newSet.add(id);  // Revert the deletion
          } else {
            newSet.delete(id);  // Revert the addition
          }
          return newSet;
        });

        console.error("Failed to update upvote:", data.message);
      }

    } catch (err) {
      console.error("Error updating upvote:", err);
      
      // Revert UI changes on error
      const isUpvoted = upvotedProfiles.has(id);
      
      setProfiles((prevProfiles) => {
        return prevProfiles.map((profile) => {
          if (profile.id === id) {
            const newUpvotes = isUpvoted
              ? profile.upvotes + 1  // Revert the decrease
              : profile.upvotes - 1;  // Revert the increase
            return { ...profile, upvotes: newUpvotes };
          }
          return profile;
        });
      });
      
      // Revert upvoted profiles state
      setUpvotedProfiles((prev) => {
        const newSet = new Set(prev);
        if (isUpvoted) {
          newSet.add(id);  // Revert the deletion
        } else {
          newSet.delete(id);  // Revert the addition
        }
        return newSet;
      });

      if (analytics) {
        logEvent(analytics, "upvote_error", {
          profile_id: id,
          user_id: user.uid,
          error: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
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
          (profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
      <div className="fixed top-4 w-full px-4 z-50 flex flex-col sm:flex-row sm:justify-between items-center">
        <div className="mb-3 sm:mb-1 sm:order-2">
        <NavButtons disableFixedPositioning={true} />
        </div>
        <div className="sm:ml-6 sm:order-1">
          <CountdownTimer />
        </div>
      </div>
      
      {/* Add padding-top to account for fixed navbar */}
      <div className="container mx-auto pt-32 sm:pt-24 px-4">
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
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
}
