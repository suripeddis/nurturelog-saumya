import { authMiddleware } from '@descope/nextjs-sdk/server';

export default authMiddleware({
  // The Descope project ID to use for authentication
  projectId: 'P2y4LoAyS4l1cjLfG51HRz145N0E',

  // The URL to redirect to if the user is not authenticated
  redirectUrl: '/sign-in',

  // An array of public routes that do not require authentication
  publicRoutes: [
    '/',           // Landing page
    '/sign-in',    // Sign-in page
    '/sample',     // Sample page (if it exists)
    '/api/*',      // API routes
  ]
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}; 
 