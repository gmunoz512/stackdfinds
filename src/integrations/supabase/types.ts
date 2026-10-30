export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          currency: string
          experience_name: string
          guests: number
          host_payout_amount: number | null
          host_user_id: string | null
          id: string
          payment_status: string
          payout_status: string | null
          platform_fee_amount: number | null
          reminder_sent_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_name: string | null
          vendor_payout_amount: number | null
          vendor_profile_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          currency?: string
          experience_name: string
          guests?: number
          host_payout_amount?: number | null
          host_user_id?: string | null
          id?: string
          payment_status?: string
          payout_status?: string | null
          platform_fee_amount?: number | null
          reminder_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
          vendor_name?: string | null
          vendor_payout_amount?: number | null
          vendor_profile_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          currency?: string
          experience_name?: string
          guests?: number
          host_payout_amount?: number | null
          host_user_id?: string | null
          id?: string
          payment_status?: string
          payout_status?: string | null
          platform_fee_amount?: number | null
          reminder_sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
          vendor_payout_amount?: number | null
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string
          created_at: string
          flag_reason: string | null
          guest_user_id: string
          host_user_id: string
          id: string
          is_flagged: boolean
        }
        Insert: {
          booking_id: string
          created_at?: string
          flag_reason?: string | null
          guest_user_id: string
          host_user_id: string
          id?: string
          is_flagged?: boolean
        }
        Update: {
          booking_id?: string
          created_at?: string
          flag_reason?: string | null
          guest_user_id?: string
          host_user_id?: string
          id?: string
          is_flagged?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          admin_notes: string | null
          alert_type: string
          created_at: string
          details: Json
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_listing_id: string | null
          target_user_id: string
        }
        Insert: {
          admin_notes?: string | null
          alert_type: string
          created_at?: string
          details?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_listing_id?: string | null
          target_user_id: string
        }
        Update: {
          admin_notes?: string | null
          alert_type?: string
          created_at?: string
          details?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_listing_id?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      host_vendor_links: {
        Row: {
          created_at: string
          host_user_id: string
          id: string
          vendor_profile_id: string
        }
        Insert: {
          created_at?: string
          host_user_id: string
          id?: string
          vendor_profile_id: string
        }
        Update: {
          created_at?: string
          host_user_id?: string
          id?: string
          vendor_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_vendor_links_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_vendor_links_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          is_confirmed: boolean
          is_public: boolean
          itinerary_data: Json
          share_token: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          itinerary_data?: Json
          share_token?: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          itinerary_data?: Json
          share_token?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itinerary_collaborators: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invite_token: string
          itinerary_id: string
          permission: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          invite_token?: string
          itinerary_id: string
          permission?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invite_token?: string
          itinerary_id?: string
          permission?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_collaborators_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_collaborators_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries_public"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          arrival_tips: string[] | null
          created_at: string
          id: string
          notes: string | null
          place_id: string | null
          planned_date: string | null
          planned_time: string | null
          share_token: string | null
          sort_order: number | null
          travel_distance: string | null
          travel_duration: string | null
          travel_duration_seconds: number | null
          updated_at: string
          user_id: string
          vendor_address: string | null
          vendor_name: string
        }
        Insert: {
          arrival_tips?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          place_id?: string | null
          planned_date?: string | null
          planned_time?: string | null
          share_token?: string | null
          sort_order?: number | null
          travel_distance?: string | null
          travel_duration?: string | null
          travel_duration_seconds?: number | null
          updated_at?: string
          user_id: string
          vendor_address?: string | null
          vendor_name: string
        }
        Update: {
          arrival_tips?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          place_id?: string | null
          planned_date?: string | null
          planned_time?: string | null
          share_token?: string | null
          sort_order?: number | null
          travel_distance?: string | null
          travel_duration?: string | null
          travel_duration_seconds?: number | null
          updated_at?: string
          user_id?: string
          vendor_address?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flag_reason: string | null
          id: string
          is_flagged: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_api_limits: {
        Row: {
          bucket: string
          endpoint: string
          expires_at: string
          request_count: number
          window_start: string
        }
        Insert: {
          bucket: string
          endpoint: string
          expires_at: string
          request_count: number
          window_start: string
        }
        Update: {
          bucket?: string
          endpoint?: string
          expires_at?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          platform_fee_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform_fee_percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          platform_fee_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          first_booking_completed_at: string | null
          full_name: string | null
          government_id_url: string | null
          host_trust_score: number
          host_verification_notes: string | null
          host_verification_status: Database["public"]["Enums"]["host_verification_status"]
          host_verified_at: string | null
          host_verified_by: string | null
          id: string
          is_banned: boolean
          phone: string | null
          recommendations: Json | null
          selfie_url: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
          user_id: string
          verified_phone: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          first_booking_completed_at?: string | null
          full_name?: string | null
          government_id_url?: string | null
          host_trust_score?: number
          host_verification_notes?: string | null
          host_verification_status?: Database["public"]["Enums"]["host_verification_status"]
          host_verified_at?: string | null
          host_verified_by?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          recommendations?: Json | null
          selfie_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_id: string
          verified_phone?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          first_booking_completed_at?: string | null
          full_name?: string | null
          government_id_url?: string | null
          host_trust_score?: number
          host_verification_notes?: string | null
          host_verification_status?: Database["public"]["Enums"]["host_verification_status"]
          host_verified_at?: string | null
          host_verified_by?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          recommendations?: Json | null
          selfie_url?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_id?: string
          verified_phone?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          booking_id: string
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
          vendor_profile_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
          vendor_profile_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_itineraries: {
        Row: {
          created_at: string
          destination: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          itinerary_data: Json | null
          share_token: string
          start_date: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          itinerary_data?: Json | null
          share_token?: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          itinerary_data?: Json | null
          share_token?: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_profiles: {
        Row: {
          about_experience: string | null
          age_restriction: string
          airbnb_experience_url: string | null
          airbnb_reviews: Json | null
          business_registration_url: string | null
          cancellation_hours: number
          category: string
          city: string | null
          commission_percentage: number | null
          created_at: string
          description: string | null
          duration: string | null
          google_place_id: string | null
          google_rating: number | null
          google_reviews_url: string | null
          host_avatar_url: string | null
          host_bio: string | null
          host_commission_percentage: number | null
          host_user_id: string | null
          id: string
          included_items: string[] | null
          instagram_url: string | null
          is_published: boolean | null
          linkedin_url: string | null
          listing_type: string
          max_guests: number | null
          meeting_point_description: string | null
          menu_url: string | null
          name: string
          ownership_evidence_urls: string[] | null
          photos: string[] | null
          price_per_person: number | null
          price_tiers: Json | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          submitted_for_review_at: string | null
          trust_score: number
          updated_at: string
          user_id: string
          vendor_id: string | null
          verification_notes: string | null
          verification_status:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          about_experience?: string | null
          age_restriction?: string
          airbnb_experience_url?: string | null
          airbnb_reviews?: Json | null
          business_registration_url?: string | null
          cancellation_hours?: number
          category: string
          city?: string | null
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_url?: string | null
          host_avatar_url?: string | null
          host_bio?: string | null
          host_commission_percentage?: number | null
          host_user_id?: string | null
          id?: string
          included_items?: string[] | null
          instagram_url?: string | null
          is_published?: boolean | null
          linkedin_url?: string | null
          listing_type?: string
          max_guests?: number | null
          meeting_point_description?: string | null
          menu_url?: string | null
          name: string
          ownership_evidence_urls?: string[] | null
          photos?: string[] | null
          price_per_person?: number | null
          price_tiers?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          submitted_for_review_at?: string | null
          trust_score?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          about_experience?: string | null
          age_restriction?: string
          airbnb_experience_url?: string | null
          airbnb_reviews?: Json | null
          business_registration_url?: string | null
          cancellation_hours?: number
          category?: string
          city?: string | null
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_url?: string | null
          host_avatar_url?: string | null
          host_bio?: string | null
          host_commission_percentage?: number | null
          host_user_id?: string | null
          id?: string
          included_items?: string[] | null
          instagram_url?: string | null
          is_published?: boolean | null
          linkedin_url?: string | null
          listing_type?: string
          max_guests?: number | null
          meeting_point_description?: string | null
          menu_url?: string | null
          name?: string
          ownership_evidence_urls?: string[] | null
          photos?: string[] | null
          price_per_person?: number | null
          price_tiers?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          submitted_for_review_at?: string | null
          trust_score?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          verification_notes?: string | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string
          commission: number
          created_at: string
          description: string | null
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category: string
          commission: number
          created_at?: string
          description?: string | null
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string
          commission?: number
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          experience_id: number
          id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          experience_id: number
          id?: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          experience_id?: number
          id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      itineraries_public: {
        Row: {
          created_at: string | null
          destination: string | null
          end_date: string | null
          id: string | null
          is_confirmed: boolean | null
          is_public: boolean | null
          itinerary_data: Json | null
          share_token: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string | null
          is_confirmed?: boolean | null
          is_public?: boolean | null
          itinerary_data?: Json | null
          share_token?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string | null
          is_confirmed?: boolean | null
          is_public?: boolean | null
          itinerary_data?: Json | null
          share_token?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews_public: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          vendor_profile_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          vendor_profile_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles_public: {
        Row: {
          about_experience: string | null
          age_restriction: string | null
          airbnb_experience_url: string | null
          airbnb_reviews: Json | null
          cancellation_hours: number | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          google_place_id: string | null
          google_rating: number | null
          google_reviews_url: string | null
          host_avatar_url: string | null
          host_bio: string | null
          id: string | null
          included_items: string[] | null
          instagram_url: string | null
          is_published: boolean | null
          linkedin_url: string | null
          listing_type: string | null
          max_guests: number | null
          meeting_point_description: string | null
          menu_url: string | null
          name: string | null
          photos: string[] | null
          price_per_person: number | null
          price_tiers: Json | null
          trust_score: number | null
          website_url: string | null
          verification_status: Database["public"]["Enums"]["vendor_verification_status"] | null
          verified_at: string | null
        }
        Insert: {
          about_experience?: string | null
          age_restriction?: string | null
          airbnb_experience_url?: string | null
          airbnb_reviews?: Json | null
          cancellation_hours?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_url?: string | null
          host_avatar_url?: string | null
          host_bio?: string | null
          id?: string | null
          included_items?: string[] | null
          instagram_url?: string | null
          is_published?: boolean | null
          linkedin_url?: string | null
          listing_type?: string | null
          max_guests?: number | null
          meeting_point_description?: string | null
          menu_url?: string | null
          name?: string | null
          photos?: string[] | null
          price_per_person?: number | null
          price_tiers?: Json | null
          trust_score?: number | null
          website_url?: string | null
          verification_status?: Database["public"]["Enums"]["vendor_verification_status"] | null
          verified_at?: string | null
        }
        Update: {
          about_experience?: string | null
          age_restriction?: string | null
          airbnb_experience_url?: string | null
          airbnb_reviews?: Json | null
          cancellation_hours?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_url?: string | null
          host_avatar_url?: string | null
          host_bio?: string | null
          id?: string | null
          included_items?: string[] | null
          instagram_url?: string | null
          is_published?: boolean | null
          linkedin_url?: string | null
          listing_type?: string | null
          max_guests?: number | null
          meeting_point_description?: string | null
          menu_url?: string | null
          name?: string | null
          photos?: string[] | null
          price_per_person?: number | null
          price_tiers?: Json | null
          trust_score?: number | null
          website_url?: string | null
          verification_status?: Database["public"]["Enums"]["vendor_verification_status"] | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_host_trust_score: {
        Args: { _user_id: string }
        Returns: number
      }
      calculate_vendor_trust_score: {
        Args: { _vendor_profile_id: string }
        Returns: number
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      consume_paid_api_quota: {
        Args: { p_endpoint: string; p_subject?: string }
        Returns: Json
      }
      get_host_listing_limit: { Args: { _user_id: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_itinerary_collaborator: {
        Args: { _itinerary_id: string; _permission?: string }
        Returns: boolean
      }
      is_itinerary_owner: { Args: { _itinerary_id: string }; Returns: boolean }
      refresh_host_trust_score: {
        Args: { _user_id: string }
        Returns: undefined
      }
      refresh_vendor_trust_score: {
        Args: { _vendor_profile_id: string }
        Returns: undefined
      }
      validate_promo_code: {
        Args: { p_code: string; p_order_amount: number }
        Returns: {
          discount_amount: number
          discount_type: string
          discount_value: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "host" | "vendor" | "user" | "admin"
      host_verification_status:
        | "unverified"
        | "pending_verification"
        | "verified"
        | "rejected"
      vendor_verification_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "changes_requested"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["host", "vendor", "user", "admin"],
      host_verification_status: [
        "unverified",
        "pending_verification",
        "verified",
        "rejected",
      ],
      vendor_verification_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "changes_requested",
        "suspended",
      ],
    },
  },
} as const
