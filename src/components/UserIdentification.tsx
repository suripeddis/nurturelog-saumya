'use client';

import { useEffect } from 'react';
import { useSession, useUser } from '@descope/nextjs-sdk/client';
import { analytics } from '@/lib/mixpanel';

export default function UserIdentification() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();

  useEffect(() => {
    // Only identify user once they're authenticated and user data is loaded
    if (!isSessionLoading && isAuthenticated && user) {
      // Use email as the primary identifier, fallback to user ID if available
      const userId = user.email || user.userId;
      
      if (userId) {
        console.log('🔍 Identifying user in Mixpanel:', userId);
        
        // Identify the user in Mixpanel
        analytics.identify(userId);
        
        // Set user properties
        const userProperties: Record<string, any> = {};
        
        if (user.name) userProperties.name = user.name;
        if (user.email) userProperties.email = user.email;
        if (user.phone) userProperties.phone = user.phone;
        
        // Add any custom attributes if they exist
        if (user.customAttributes) {
          Object.entries(user.customAttributes).forEach(([key, value]) => {
            userProperties[key] = value;
          });
        }
        
        // Set the user properties in Mixpanel
        if (Object.keys(userProperties).length > 0) {
          analytics.setUserProperties(userProperties);
        }
        
        console.log('✅ User identified in Mixpanel with properties:', userProperties);
      }
    }
  }, [isAuthenticated, isSessionLoading, user]);

  // This component doesn't render anything
  return null;
} 