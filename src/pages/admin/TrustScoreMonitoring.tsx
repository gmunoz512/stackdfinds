import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";

interface VendorTrust {
  id: string;
  name: string;
  category: string;
  trust_score: number;
  verification_status: string;
  created_at: string;
  user_id: string;
}

const TrustScoreMonitoring = () => {
  const navigate = useNavigate();
  
  // Check admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
      return !!data;
    },
  });

  // Fetch vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendorTrustScores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, trust_score, verification_status, created_at, user_id')
        .order('trust_score', { ascending: true }); // Lowest scores first
      if (error) throw error;
      return data as VendorTrust[];
    },
    enabled: isAdmin,
  });

  if (isCheckingAdmin) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) return (
    <div className="min-h-screen p-8 text-center">
      <AlertTriangle className="h-12 w-12 mx-auto text-rating mb-4" />
      <p>Access Denied</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-info-strong to-indigo-strong px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-paper/10 hover:bg-paper/20 transition-all">
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">Trust Score Monitoring</h1>
              <p className="text-sm text-paper/70">Monitor vendor health and reliability</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {isLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : vendors?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No vendors found.
            </Card>
          ) : vendors?.map(vendor => (
            <Card key={vendor.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/vendor/${vendor.id}`)}>
              <div>
                <h3 className="font-semibold">{vendor.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{vendor.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{vendor.verification_status}</span>
                </div>
              </div>
              <TrustScoreBadge score={vendor.trust_score} size="md" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TrustScoreMonitoring;
