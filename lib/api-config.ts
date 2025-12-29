/**
 * API Configuration for Zenith Event Management System
 * 
 * All endpoints are relative to the Next.js app (no external backend)
 */

export const API_BASE_URL = '';

export const API_ENDPOINTS = {
  // ===== AUTHENTICATION =====
  register: '/api/registration',              // POST (FormData)
  login: '/api/user/login',                   // POST (JSON)
  
  // ===== USER ENDPOINTS =====
  userProfile: '/api/user/profile',                    // GET, PUT
  lookingForTeam: '/api/user/looking-for-team',        // GET, PUT
  userRsvp: '/api/user/rsvp',                          // PUT
  userRsvpStatus: '/api/user/rsvp-status',             // GET
  
  // ===== TEAM ENDPOINTS =====
  createTeam: '/api/team/create',                      // POST
  lookingForMembers: '/api/team/looking-for-members',  // GET, PUT
  joinTeam: '/api/team/join',                          // PUT
  joinRequest: '/api/team/join-request',               // POST, GET
  respondToJoinRequest: (requestId: string) => `/api/team/join-request/${requestId}`,  // PUT
  leaveTeam: '/api/team/leave',                        // PUT
  removeMember: '/api/team/remove-member',             // PUT
  uploadSubmission: '/api/team/upload-submission',     // POST
  submitApplication: '/api/team/submit-application',   // POST
  updateSubmission: '/api/team/update-submission',     // PUT
  withdrawSubmission: '/api/team/withdraw-submission', // PUT
  deleteTeam: '/api/team/delete',                      // DELETE
  getTeam: (teamCode: string) => `/api/team/${teamCode}`,  // GET
  getTeamMembers: (teamCode: string) => `/api/team/${teamCode}/members`,  // GET (for users looking for teams)
  
  // ===== ADMIN ENDPOINTS =====
  adminParticipants: '/api/admin/participants',        // GET
  adminParticipantDetails: (id: string) => `/api/admin/participants/${id}`,  // GET
  adminTeams: '/api/admin/teams',                      // GET
  adminTeamDetails: (teamCode: string) => `/api/admin/teams/${teamCode}`,    // GET
  adminUpdateTeam: (teamCode: string) => `/api/admin/teams/${teamCode}`,     // PUT
  adminEvaluators: '/api/admin/evaluators',            // GET
  adminAssignEvaluators: '/api/admin/evaluators/assign',  // PUT
  adminFinalizeTeams: '/api/admin/finalize-teams',     // PUT
  adminExport: '/api/admin/export',                    // GET
  adminProblemStatements: '/api/admin/problem-statements',  // POST
  adminUpdateProblemStatement: (id: string) => `/api/admin/problem-statements/${id}`,  // PUT
  
  // ===== EVALUATOR ENDPOINTS =====
  evaluatorTeams: '/api/evaluator/teams',              // GET
  evaluatorTeamDetails: (teamCode: string) => `/api/evaluator/teams/${teamCode}`,  // GET
  evaluatorEvaluate: '/api/evaluator/evaluate',        // PUT
  evaluatorUpdateEvaluation: (teamCode: string) => `/api/evaluator/evaluate/${teamCode}/update`,  // PUT
  
  // ===== PROBLEM STATEMENT ENDPOINTS =====
  problemStatements: '/api/problem-statements',        // GET
  problemStatementDetails: (id: string) => `/api/problem-statements/${id}`,  // GET
};

/**
 * Helper function to build full API URL
 * (Not needed since we're using relative paths in same Next.js app)
 */
export function getApiUrl(endpoint: string): string {
  return endpoint;
}
