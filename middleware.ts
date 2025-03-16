import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Define which paths should be protected
const protectedApiPaths = [
  '/api/users/[id]',
  // '/api/colleges',
  // Add other API paths that need authentication
];
// Define paths that should be excluded from authentication
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/validate-step',
  '/api/registration',
  'api/validate-step',
  'api/colleges',
  'api/auth/logout',
  'api/users/[id]/status',
  'api/users/[id]/upvote',
  'api/users/[id]',
  'api/users/sync-upvotes',
  'api/users/',
];


// Initialize Firebase Admin SDK if not already initialized
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Check for environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      console.error('Firebase Admin SDK credentials missing');
      throw new Error('Firebase Admin credentials not found');
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
  return getAuth();
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for an API route
  if (pathname.startsWith('/api/')) {
    // Skip authentication for public API paths
    if (publicApiPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // For all other API paths, require authentication
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Initialize Firebase Admin and verify the token
      const auth = initializeFirebaseAdmin();
      const decodedToken = await auth.verifyIdToken(token);
      
      if (!decodedToken) {
        throw new Error('Invalid token');
      }      
      // Allow the request to proceed
      return NextResponse.next();
    } catch (error: any) {
      console.error('Token verification failed:', error.message);
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: error.name === 'auth/id-token-expired' 
            ? 'Token has expired' 
            : 'Invalid or malformed token'
        },
        { status: 401 }
      );
    }
  }

  // For non-API routes, allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};