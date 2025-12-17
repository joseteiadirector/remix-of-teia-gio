import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Loader2, Save, Mail, Phone, Building2, Briefcase, Bell, Palette, Globe } from "lucide-react";
import { logger } from "@/utils/logger";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  preferences: {
    email_notifications?: boolean;
    weekly_reports?: boolean;
    dark_mode?: boolean;
    language?: string;
  } | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    full_name: "",
    avatar_url: null,
    phone: "",
    company: "",
    job_title: "",
    preferences: {
      email_notifications: true,
      weekly_reports: true,
      dark_mode: true,
      language: "pt"
    }
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || "",
          avatar_url: data.avatar_url,
          phone: data.phone || "",
          company: data.company || "",
          job_title: data.job_title || "",
          preferences: (data.preferences as ProfileData['preferences']) || {
            email_notifications: true,
            weekly_reports: true,
            dark_mode: true,
            language: "pt"
          }
        });
      } else {
        // Profile doesn't exist yet, create it
        setProfile(prev => ({ ...prev, id: user?.id || "" }));
      }
    } catch (error) {
      logger.error("Error fetching profile:", error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          company: profile.company,
          job_title: profile.job_title,
          preferences: profile.preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      logger.error("Error saving profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi alterada."
      });
    } catch (error) {
      logger.error("Error uploading avatar:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar sua foto.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container max-w-4xl py-8 space-y-8 animate-fadeIn">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">Meu Perfil</h1>
              <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
            </div>
          </div>
        </div>

      {/* Avatar Section */}
      <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Foto de Perfil</CardTitle>
          <CardDescription>Esta é sua foto que aparece em toda a plataforma</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "Avatar"} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{profile.full_name || "Sem nome definido"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Enviando..." : "Alterar foto"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          <CardDescription>Seus dados de identificação na plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </Label>
              <Input
                id="company"
                value={profile.company || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="job_title" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Cargo
              </Label>
              <Input
                id="job_title"
                value={profile.job_title || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, job_title: e.target.value }))}
                placeholder="Seu cargo na empresa"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Preferências</CardTitle>
          <CardDescription>Configure notificações e comportamentos da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notificações por E-mail</p>
                <p className="text-sm text-muted-foreground">Receba alertas importantes por e-mail</p>
              </div>
            </div>
            <Switch
              checked={profile.preferences?.email_notifications ?? true}
              onCheckedChange={(checked) => handlePreferenceChange("email_notifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Relatórios Semanais</p>
                <p className="text-sm text-muted-foreground">Receba resumos semanais por e-mail</p>
              </div>
            </div>
            <Switch
              checked={profile.preferences?.weekly_reports ?? true}
              onCheckedChange={(checked) => handlePreferenceChange("weekly_reports", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Modo Escuro</p>
                <p className="text-sm text-muted-foreground">Interface com tema escuro</p>
              </div>
            </div>
            <Switch
              checked={profile.preferences?.dark_mode ?? true}
              onCheckedChange={(checked) => handlePreferenceChange("dark_mode", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Idioma</p>
                <p className="text-sm text-muted-foreground">Idioma da interface</p>
              </div>
            </div>
            <select
              value={profile.preferences?.language || "pt"}
              onChange={(e) => handlePreferenceChange("language", e.target.value)}
              className="bg-muted border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
      </div>
    </div>
  );
}