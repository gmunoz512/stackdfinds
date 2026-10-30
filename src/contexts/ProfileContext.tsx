import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { RecommendationItem, UserProfile } from '@/types';
import type { Json } from '@/integrations/supabase/types';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  recommendations: RecommendationItem[];
  addRecommendation: (item: Omit<RecommendationItem, 'addedAt'>) => Promise<void>;
  removeRecommendation: (id: string, type: RecommendationItem['type']) => Promise<void>;
  hasRecommendation: (id: string, type: RecommendationItem['type']) => boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Helper to safely parse recommendations from JSON
const parseRecommendations = (data: Json | null): RecommendationItem[] => {
  if (!data || !Array.isArray(data)) return [];
  
  const result: RecommendationItem[] = [];
  
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.id === 'string' &&
      (obj.type === 'vendor' || obj.type === 'restaurant' || obj.type === 'experience') &&
      typeof obj.addedAt === 'string'
    ) {
      result.push({
        id: obj.id,
        type: obj.type,
        addedAt: obj.addedAt,
      });
    }
  }
  
  return result;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no profile exists, create one
      if (!data && !error) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, email: user.email })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          data = newProfile;
        }
      }

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          zip_code: data.zip_code,
          recommendations: parseRecommendations(data.recommendations),
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const recommendations = profile?.recommendations ?? [];

  const addRecommendation = useCallback(async (item: Omit<RecommendationItem, 'addedAt'>) => {
    if (!user) {
      throw new Error('You must be signed in to add vendors to your list.');
    }
    
    // If no profile yet, try to create one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, email: user.email })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', createError);
        throw new Error('Unable to create profile. Please try again.');
      }
      
      // Set the profile immediately
      setProfile({
        id: newProfile.id,
        user_id: newProfile.user_id,
        full_name: newProfile.full_name,
        email: newProfile.email,
        phone: newProfile.phone,
        city: newProfile.city,
        zip_code: newProfile.zip_code,
        recommendations: parseRecommendations(newProfile.recommendations),
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at,
      });
    }

    const newItem: RecommendationItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };

    // Check if already exists
    const exists = recommendations.some(r => r.id === item.id && r.type === item.type);
    if (exists) return;

    const updatedRecommendations = [...recommendations, newItem];

    const { error } = await supabase
      .from('profiles')
      .update({ recommendations: updatedRecommendations as unknown as Json })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error adding recommendation:', error);
      throw error;
    }

    setProfile(prev => prev ? { ...prev, recommendations: updatedRecommendations } : null);
  }, [user, profile, recommendations]);

  const removeRecommendation = useCallback(async (id: string, type: RecommendationItem['type']) => {
    if (!user) {
      throw new Error('You must be signed in to remove vendors from your list.');
    }
    if (!profile) return; // Can't remove from empty list

    const updatedRecommendations = recommendations.filter(
      r => !(r.id === id && r.type === type)
    );

    const { error } = await supabase
      .from('profiles')
      .update({ recommendations: updatedRecommendations as unknown as Json })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing recommendation:', error);
      throw error;
    }

    setProfile(prev => prev ? { ...prev, recommendations: updatedRecommendations } : null);
  }, [user, profile, recommendations]);

  const hasRecommendation = useCallback((id: string, type: RecommendationItem['type']) => {
    return recommendations.some(r => r.id === id && r.type === type);
  }, [recommendations]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        recommendations,
        addRecommendation,
        removeRecommendation,
        hasRecommendation,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
