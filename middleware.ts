import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Define which paths should be protected
const protectedApiPaths = [
  '/api/users',
  '/api/dashboard',
  '/api/profile',
  '/api/admin',
  // Add other API paths that need authentication
];

// Define paths that should be excluded from authentication
const publicApiPaths = [
  '/api/auth/login',
  '/api/registration',
    // Add other public API paths
];

// JWT secret key - should match the one used to sign tokens
const JWT_SECRET = process.env.JWT_SECRET || 'pbforever';

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
      // Verify token using JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded) {
        throw new Error('Invalid token');
      }

      // You can add additional checks here, like:
      // - Check if user exists in database
      // - Check if user has required permissions
      // - Check if token is blacklisted
      
      // Allow the request to proceed
      return NextResponse.next();
    } catch (error: any) {
      console.error('Token verification failed:', error.message);
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: error.name === 'TokenExpiredError' 
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