import { type ReactNode, useEffect } from 'react';
import { SignupProvider, useSignup } from './SignupContext';
import { BookingProvider, useBooking } from './BookingContext';
import { SearchProvider } from './SearchContext';

// Re-export hooks for backward compatibility
export { useSignup } from './SignupContext';
export { useBooking } from './BookingContext';
export { useSearch } from './SearchContext';

// Re-export types for backward compatibility
export type { 
  HostSignupData, 
  PropertyData, 
  VendorSignupData, 
  BusinessData 
} from './SignupContext';
export type { BookingData, GuestData } from './BookingContext';

// Combined provider that wraps both contexts
export const UserProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SignupProvider>
      <BookingProvider>
        <SearchProvider>
          <LegacyCleanup />
          {children}
        </SearchProvider>
      </BookingProvider>
    </SignupProvider>
  );
};

// Component to clean up old localStorage keys on mount
const LegacyCleanup = ({ children }: { children?: ReactNode }) => {
  useEffect(() => {
    // Remove old localStorage data (migrating to sessionStorage)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('hasCompletedSignup');
    localStorage.removeItem('hostSignupData');
    localStorage.removeItem('propertyData');
    localStorage.removeItem('vendorSignupData');
    localStorage.removeItem('businessData');
    localStorage.removeItem('bookingData');
    localStorage.removeItem('guestData');
  }, []);

  return <>{children}</>;
};

// Legacy hook for backward compatibility - combines both contexts
// Components should migrate to useSignup or useBooking for better performance
export const useUser = () => {
  const signupContext = useSignup();
  const bookingContext = useBooking();

  return {
    // Signup data
    hostSignupData: signupContext.hostSignupData,
    propertyData: signupContext.propertyData,
    vendorSignupData: signupContext.vendorSignupData,
    businessData: signupContext.businessData,
    updateHostSignupData: signupContext.updateHostSignupData,
    updatePropertyData: signupContext.updatePropertyData,
    updateVendorSignupData: signupContext.updateVendorSignupData,
    updateBusinessData: signupContext.updateBusinessData,
    clearSignupData: signupContext.clearSignupData,
    // Booking data
    bookingData: bookingContext.bookingData,
    guestData: bookingContext.guestData,
    updateBookingData: bookingContext.updateBookingData,
    updateGuestData: bookingContext.updateGuestData,
  };
};
