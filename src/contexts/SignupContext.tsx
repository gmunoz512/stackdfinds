import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

// Legacy types - kept for backwards compatibility with existing components
// New components should use the database profile directly
export interface HostSignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PropertyData {
  propertyName: string;
  airbnbUrl: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface VendorSignupData {
  businessName: string;
  businessType: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface BusinessData {
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
}

interface SignupContextType {
  hostSignupData: HostSignupData;
  propertyData: PropertyData;
  vendorSignupData: VendorSignupData;
  businessData: BusinessData;
  updateHostSignupData: (data: Partial<HostSignupData>) => void;
  updatePropertyData: (data: Partial<PropertyData>) => void;
  updateVendorSignupData: (data: Partial<VendorSignupData>) => void;
  updateBusinessData: (data: Partial<BusinessData>) => void;
  clearSignupData: () => void;
}

const initialHostSignupData: HostSignupData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const initialPropertyData: PropertyData = {
  propertyName: '',
  airbnbUrl: '',
  address: '',
  city: '',
  state: '',
  zip: '',
};

const initialVendorSignupData: VendorSignupData = {
  businessName: '',
  businessType: '',
  contactName: '',
  email: '',
  phone: '',
};

const initialBusinessData: BusinessData = {
  address: '',
  city: '',
  state: '',
  zip: '',
  description: '',
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export const SignupProvider = ({ children }: { children: ReactNode }) => {
  // Legacy signup flow data - kept for backwards compatibility
  // New signup uses progressive onboarding, this context is largely unused now
  const [hostSignupData, setHostSignupData] = useState<HostSignupData>(() => {
    const stored = sessionStorage.getItem('hostSignupData');
    return stored ? JSON.parse(stored) : initialHostSignupData;
  });

  const [propertyData, setPropertyData] = useState<PropertyData>(() => {
    const stored = sessionStorage.getItem('propertyData');
    return stored ? JSON.parse(stored) : initialPropertyData;
  });

  const [vendorSignupData, setVendorSignupData] = useState<VendorSignupData>(() => {
    const stored = sessionStorage.getItem('vendorSignupData');
    return stored ? JSON.parse(stored) : initialVendorSignupData;
  });

  const [businessData, setBusinessData] = useState<BusinessData>(() => {
    const stored = sessionStorage.getItem('businessData');
    return stored ? JSON.parse(stored) : initialBusinessData;
  });

  // Debounced persistence to sessionStorage (500ms delay for mobile performance)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      sessionStorage.setItem('hostSignupData', JSON.stringify(hostSignupData));
      sessionStorage.setItem('propertyData', JSON.stringify(propertyData));
      sessionStorage.setItem('vendorSignupData', JSON.stringify(vendorSignupData));
      sessionStorage.setItem('businessData', JSON.stringify(businessData));
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [hostSignupData, propertyData, vendorSignupData, businessData]);

  const updateHostSignupData = (data: Partial<HostSignupData>) => {
    setHostSignupData(prev => ({ ...prev, ...data }));
  };

  const updatePropertyData = (data: Partial<PropertyData>) => {
    setPropertyData(prev => ({ ...prev, ...data }));
  };

  const updateVendorSignupData = (data: Partial<VendorSignupData>) => {
    setVendorSignupData(prev => ({ ...prev, ...data }));
  };

  const updateBusinessData = (data: Partial<BusinessData>) => {
    setBusinessData(prev => ({ ...prev, ...data }));
  };

  const clearSignupData = () => {
    setHostSignupData(initialHostSignupData);
    setPropertyData(initialPropertyData);
    setVendorSignupData(initialVendorSignupData);
    setBusinessData(initialBusinessData);
    sessionStorage.removeItem('hostSignupData');
    sessionStorage.removeItem('propertyData');
    sessionStorage.removeItem('vendorSignupData');
    sessionStorage.removeItem('businessData');
  };

  return (
    <SignupContext.Provider 
      value={{ 
        hostSignupData, 
        propertyData,
        vendorSignupData,
        businessData,
        updateHostSignupData, 
        updatePropertyData,
        updateVendorSignupData,
        updateBusinessData,
        clearSignupData,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
};
