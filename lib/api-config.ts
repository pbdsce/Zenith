/**
 * API Configuration for Zenith Event Management System
 * 
 * All endpoints are relative to the Next.js app (no external backend)
 */

export const API_BASE_URL = '';

export const API_ENDPOINTS = {
  // ===== AUTHENTICATION =====
  register: '/zenith/api/registration',              // POST (FormData)
  login: '/zenith/api/user/login',                   // POST (JSON)
  
  // ===== USER ENDPOINTS =====
  userProfile: '/zenith/api/user/profile',                    // GET, PUT
  lookingForTeam: '/zenith/api/user/looking-for-team',        // GET, PUT
  userRsvp: '/zenith/api/user/rsvp',                          // PUT
  userRsvpStatus: '/zenith/api/user/rsvp-status',             // GET
  
  // ===== TEAM ENDPOINTS =====
  createTeam: '/zenith/api/team/create',                      // POST
  lookingForMembers: '/zenith/api/team/looking-for-members',  // GET, PUT
  joinTeam: '/zenith/api/team/join',                          // PUT
  joinRequest: '/zenith/api/team/join-request',               // POST, GET
  respondToJoinRequest: (requestId: string) => `/zenith/api/team/join-request/${requestId}`,  // PUT
  leaveTeam: '/zenith/api/team/leave',                        // PUT
  removeMember: '/zenith/api/team/remove-member',             // PUT
  uploadSubmission: '/zenith/api/team/upload-submission',     // POST
  submitApplication: '/zenith/api/team/submit-application',   // POST
  updateSubmission: '/zenith/api/team/update-submission',     // PUT
  withdrawSubmission: '/zenith/api/team/withdraw-submission', // PUT
  updateProblemStatement: '/zenith/api/team/update-problem-statement', // PUT
  deleteTeam: '/zenith/api/team/delete',                      // DELETE
  getTeam: (teamCode: string) => `/zenith/api/team/${teamCode}`,  // GET
  getTeamMembers: (teamCode: string) => `/zenith/api/team/${teamCode}/members`,  // GET (for users looking for teams)
  
  // ===== ADMIN ENDPOINTS =====
  adminParticipants: '/zenith/api/admin/participants',        // GET
  adminParticipantDetails: (id: string) => `/zenith/api/admin/participants/${id}`,  // GET
  adminTeams: '/zenith/api/admin/teams',                      // GET
  adminTeamDetails: (teamCode: string) => `/zenith/api/admin/teams/${teamCode}`,    // GET
  adminUpdateTeam: (teamCode: string) => `/zenith/api/admin/teams/${teamCode}`,     // PUT
  adminEvaluators: '/zenith/api/admin/evaluators',            // GET
  adminAssignEvaluators: '/zenith/api/admin/evaluators/assign',  // PUT
  adminFinalizeTeams: '/zenith/api/admin/finalize-teams',     // PUT
  adminExport: '/zenith/api/admin/export',                    // GET
  adminProblemStatements: '/zenith/api/admin/problem-statements',  // POST
  adminUpdateProblemStatement: (id: string) => `/zenith/api/admin/problem-statements/${id}`,  // PUT
  
  // ===== EVALUATOR ENDPOINTS =====
  evaluatorTeams: '/zenith/api/evaluator/teams',              // GET
  evaluatorTeamDetails: (teamCode: string) => `/zenith/api/evaluator/teams/${teamCode}`,  // GET
  evaluatorEvaluate: '/zenith/api/evaluator/evaluate',        // PUT
  evaluatorUpdateEvaluation: (teamCode: string) => `/zenith/api/evaluator/evaluate/${teamCode}/update`,  // PUT
  adminPromoteUser: '/zenith/api/admin/users/promote',        // PUT
  // ===== PROBLEM STATEMENT ENDPOINTS =====
  problemStatements: '/zenith/api/problem-statements',        // GET
  problemStatementDetails: (id: string) => `/zenith/api/problem-statements/${id}`,  // GET
};

/**
 * Helper function to build full API URL
 * (Not needed since we're using relative paths in same Next.js app)
 */
export function getApiUrl(endpoint: string): string {
  return endpoint;
}
