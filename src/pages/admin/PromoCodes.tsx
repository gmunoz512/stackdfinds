import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Loader2, Tag, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface PromoFormData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_uses: string;
  min_order_amount: string;
  expires_at: string;
  is_active: boolean;
}

const initialFormData: PromoFormData = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  max_uses: '',
  min_order_amount: '0',
  expires_at: '',
  is_active: true,
};

const AdminPromoCodes = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const { toast } = useToast();
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromoFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (!error && data) {
        setIsAdmin(true);
      } else {
        navigate('/appview');
      }
    };
    
    if (!authLoading && isAuthenticated) {
      checkAdmin();
    } else if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [user, authLoading, isAuthenticated, navigate]);

  // Fetch promo codes
  useEffect(() => {
    const fetchPromoCodes = async () => {
      if (!isAdmin) return;
      
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching promo codes:', error);
        toast({
          title: "Error",
          description: "Failed to load promo codes",
          variant: "destructive",
        });
      } else {
        setPromoCodes((data || []) as PromoCode[]);
      }
      setIsLoading(false);
    };
    
    fetchPromoCodes();
  }, [isAdmin, toast]);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      max_uses: promo.max_uses?.toString() || '',
      min_order_amount: promo.min_order_amount.toString(),
      expires_at: promo.expires_at ? promo.expires_at.split('T')[0] : '',
      is_active: promo.is_active,
    });
    setEditingId(promo.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.discount_value) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const promoData = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingId);
        
        if (error) throw error;
        
        setPromoCodes(prev => prev.map(p => 
          p.id === editingId ? { ...p, ...promoData } : p
        ));
        
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('promo_codes')
          .insert(promoData)
          .select()
          .single();
        
        if (error) throw error;
        
        setPromoCodes(prev => [data as PromoCode, ...prev]);
        
        toast({
          title: "Success",
          description: "Promo code created successfully",
        });
      }
      
      setDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save promo code",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      setPromoCodes(prev => prev.map(p => 
        p.id === promo.id ? { ...p, is_active: !p.is_active } : p
      ));
    }
  };

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return <Badge variant="outline">Limit Reached</Badge>;
    }
    return <Badge className="bg-success/20 text-success-strong border-success/30">Active</Badge>;
  };

  if (authLoading || (!isAdmin && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUses = promoCodes.reduce((acc, p) => acc + p.current_uses, 0);
  const activeCodes = promoCodes.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-4 py-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Link 
              to="/admin/settings"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <h1 className="text-lg font-semibold">Promo Codes</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <Tag className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{promoCodes.length}</p>
              <p className="text-xs text-muted-foreground">Total Codes</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="w-5 h-5 mx-auto mb-2 rounded-full bg-success/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <p className="text-2xl font-bold">{activeCodes}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </Card>
            <Card className="p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold">{totalUses}</p>
              <p className="text-xs text-muted-foreground">Total Uses</p>
            </Card>
          </div>

          {/* Create Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="w-full" variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Create New Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Promo Code' : 'Create Promo Code'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., SUMMER25"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="uppercase"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select 
                      value={formData.discount_type} 
                      onValueChange={(v: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discount_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      Value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      placeholder={formData.discount_type === 'percentage' ? '25' : '20'}
                      value={formData.discount_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_uses">Max Uses</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      placeholder="Unlimited"
                      value={formData.max_uses}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_order_amount">Min Order ($)</Label>
                    <Input
                      id="min_order_amount"
                      type="number"
                      placeholder="0"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                
                <Button 
                  onClick={handleSave} 
                  className="w-full" 
                  variant="gradient"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update Promo Code' : 'Create Promo Code'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Promo Codes Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No promo codes yet</p>
                <p className="text-sm">Create your first promo code above</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="text-center">Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-semibold">
                        {promo.code}
                      </TableCell>
                      <TableCell>
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}%`
                          : `$${promo.discount_value}`
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{promo.current_uses}</span>
                        <span className="text-muted-foreground">
                          /{promo.max_uses || '∞'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(promo)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={promo.is_active}
                            onCheckedChange={() => toggleActive(promo)}
                            className="data-[state=checked]:bg-success"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(promo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPromoCodes;