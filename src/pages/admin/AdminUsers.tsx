import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Shield, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface UserWithBrands {
  user_id: string;
  brands_count: number;
  brands: string[];
  role: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithBrands[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithBrands | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all brands grouped by user
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('user_id, name, created_at')
        .order('created_at', { ascending: false });

      if (brandsError) throw brandsError;

      // Get user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Group by user
      const userMap = new Map<string, UserWithBrands>();
      
      brandsData?.forEach(brand => {
        const existing = userMap.get(brand.user_id);
        if (existing) {
          existing.brands_count++;
          existing.brands.push(brand.name);
        } else {
          const role = rolesData?.find(r => r.user_id === brand.user_id)?.role || null;
          userMap.set(brand.user_id, {
            user_id: brand.user_id,
            brands_count: 1,
            brands: [brand.name],
            role,
            created_at: brand.created_at || new Date().toISOString()
          });
        }
      });

      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      if (newRole === 'remove') {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id);
        
        if (error) throw error;
        toast.success('Role removida com sucesso');
      } else {
        // Upsert role
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedUser.user_id,
            role: newRole as 'admin' | 'user'
          }, { onConflict: 'user_id' });

        if (error) throw error;
        toast.success('Role atualizada com sucesso');
      }

      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.brands.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground">Gerenciar usuários e permissões</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Marcas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((acc, u) => acc + u.brands_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Lista de todos os usuários registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Marcas</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-mono text-xs">
                      {user.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.brands.slice(0, 3).map((brand, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                        {user.brands.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.brands.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge 
                          variant="outline" 
                          className={user.role === 'admin' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-muted'}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role || '');
                          setRoleDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Role</DialogTitle>
            <DialogDescription>
              Alterar permissões do usuário {selectedUser?.user_id.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="remove">Remover Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRoleChange}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
