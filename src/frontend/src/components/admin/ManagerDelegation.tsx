import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Trash2, Shield, Users } from 'lucide-react';
import { useGetManagers, useAddManager, useRemoveManager, useGetBoss } from '@/hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

/**
 * Boss-only component for managing delegated manager rights.
 * Allows the Boss to grant and revoke management access to other principals.
 */
export default function ManagerDelegation() {
  const [principalInput, setPrincipalInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const { data: managers = [], isLoading: loadingManagers } = useGetManagers();
  const { data: boss, isLoading: loadingBoss } = useGetBoss();
  const addManagerMutation = useAddManager();
  const removeManagerMutation = useRemoveManager();

  const validateAndAddManager = async () => {
    const trimmed = principalInput.trim();
    if (!trimmed) {
      toast.error('Please enter a Principal ID');
      return;
    }

    setIsValidating(true);
    try {
      const principal = Principal.fromText(trimmed);
      
      // Check if it's the Boss
      if (boss && principal.toString() === boss.toString()) {
        toast.error('The Boss already has full access');
        setIsValidating(false);
        return;
      }

      // Check if already a manager
      if (managers.some(m => m.toString() === principal.toString())) {
        toast.error('This principal is already a manager');
        setIsValidating(false);
        return;
      }

      await addManagerMutation.mutateAsync(principal);
      setPrincipalInput('');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid principal')) {
        toast.error('Invalid Principal ID format');
      } else {
        toast.error('Failed to add manager');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveManager = async (principal: Principal) => {
    try {
      await removeManagerMutation.mutateAsync(principal);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const isProcessing = addManagerMutation.isPending || removeManagerMutation.isPending || isValidating;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Manager Delegation</h2>
          <p className="text-muted-foreground">
            Grant or revoke management rights to other users
          </p>
        </div>
      </div>

      {/* Boss Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Boss (Owner)
          </CardTitle>
          <CardDescription>
            The permanent administrator with full control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBoss ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : boss ? (
            <div className="font-mono text-sm bg-muted p-3 rounded-md break-all">
              {boss.toString()}
            </div>
          ) : (
            <p className="text-muted-foreground">No Boss assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Add Manager Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Management Rights
          </CardTitle>
          <CardDescription>
            Enter a Principal ID to grant management access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal-input">Principal ID</Label>
            <div className="flex gap-2">
              <Input
                id="principal-input"
                placeholder="e.g., aaaaa-aa..."
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProcessing) {
                    validateAndAddManager();
                  }
                }}
                disabled={isProcessing}
                className="font-mono text-sm"
              />
              <Button
                onClick={validateAndAddManager}
                disabled={isProcessing || !principalInput.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Managers can access all admin operations except managing other managers.
          </p>
        </CardContent>
      </Card>

      {/* Managers List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Managers
            <Badge variant="secondary" className="ml-2">
              {managers.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Users with delegated management rights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingManagers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : managers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No managers assigned yet</p>
              <p className="text-sm mt-1">Add a Principal ID above to grant management rights</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.toString()}>
                      <TableCell className="font-mono text-sm break-all">
                        {manager.toString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveManager(manager)}
                          disabled={isProcessing}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
