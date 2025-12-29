import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import User, { IUser } from '@/models/User';
import Team from '@/models/Team';

// Types for authenticated requests
export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'evaluator';
  teamCode?: string;
  isLooking: boolean;
  _id: string;
}

export interface AuthResult {
  success: true;
  user: AuthenticatedUser;
  firebaseToken: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  };
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  status: number;
}

type AuthResponse = AuthResult | AuthError;

/**
 * Verify Firebase token and get user from database
 * Returns user data if authenticated, error object if not
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        status: 401,
      };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Invalid authorization header' },
        status: 401,
      };
    }

    // Verify token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (firebaseError: any) {
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/id-token-expired') {
        return {
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired' },
          status: 401,
        };
      }
      if (firebaseError.code === 'auth/argument-error') {
        return {
          success: false,
          error: { code: 'TOKEN_INVALID', message: 'Invalid authentication token' },
          status: 401,
        };
      }
      throw firebaseError;
    }

    // Connect to database and fetch user
    await dbConnect();
    const user = await User.findOne({ uid: decodedToken.uid });

    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found in database' },
        status: 404,
      };
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        teamCode: user.teamCode,
        isLooking: user.isLooking,
        _id: user._id.toString(),
      },
      firebaseToken: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
      },
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication failed' },
      status: 500,
    };
  }
}

/**
 * Check if authenticated user is an admin
 */
export function requireAdmin(authResult: AuthResult): AuthError | null {
  if (authResult.user.role !== 'admin') {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
      status: 403,
    };
  }
  return null;
}

/**
 * Check if authenticated user is an evaluator
 */
export function requireEvaluator(authResult: AuthResult): AuthError | null {
  if (authResult.user.role !== 'evaluator') {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Evaluator access required' },
      status: 403,
    };
  }
  return null;
}

/**
 * Check if authenticated user has verified email
 */
export function requireEmailVerified(authResult: AuthResult): AuthError | null {
  if (authResult.firebaseToken.email_verified !== true) {
    return {
      success: false,
      error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email verification required' },
      status: 403,
    };
  }
  return null;
}

/**
 * Check if authenticated user is team lead for a specific team
 */
export async function requireTeamLead(
  authResult: AuthResult, 
  teamCode: string
): Promise<{ team: any } | AuthError> {
  await dbConnect();
  
  const team = await Team.findOne({ teamCode });
  
  if (!team) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Team not found' },
      status: 404,
    };
  }

  if (team.teamLead !== authResult.user.uid) {
    return {
      success: false,
      error: { code: 'NOT_TEAM_LEAD', message: 'Only team lead can perform this action' },
      status: 403,
    };
  }

  return { team };
}

/**
 * Check if authenticated user is a member of a specific team
 */
export async function requireTeamMember(
  authResult: AuthResult,
  teamCode: string
): Promise<{ team: any } | AuthError> {
  await dbConnect();
  
  const team = await Team.findOne({ teamCode });
  
  if (!team) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Team not found' },
      status: 404,
    };
  }

  const isMember = team.teamMembers.some(
    (member: any) => member.uid === authResult.user.uid || member === authResult.user.uid
  );

  if (!isMember) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Must be a team member' },
      status: 403,
    };
  }

  return { team };
}

/**
 * Helper to create error response
 */
export function createAuthErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: error.error.message,
      error: error.error,
      timestamp: new Date().toISOString(),
    },
    { status: error.status }
  );
}

/**
 * Helper to check if result is an error
 */
export function isAuthError(result: AuthResponse | { team: any }): result is AuthError {
  return 'success' in result && result.success === false;
}
