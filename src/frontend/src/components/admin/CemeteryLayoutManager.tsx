import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useGetCemeteryState,
  useAddAlley,
  useRemoveAlley,
  useAddGrave,
  useRemoveGrave,
} from '../../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CemeteryLayoutManager() {
  const { data: cemetery, isLoading } = useGetCemeteryState();
  const addAlley = useAddAlley();
  const removeAlley = useRemoveAlley();
  const addGrave = useAddGrave();
  const removeGrave = useRemoveGrave();

  const [newAlleyName, setNewAlleyName] = useState('');
  const [selectedAlley, setSelectedAlley] = useState('');
  const [newPlotNumber, setNewPlotNumber] = useState('');
  const [deleteAlleyDialog, setDeleteAlleyDialog] = useState<string | null>(null);
  const [deleteGraveDialog, setDeleteGraveDialog] = useState<bigint | null>(null);

  const handleAddAlley = async () => {
    if (!newAlleyName.trim()) {
      return;
    }

    try {
      await addAlley.mutateAsync(newAlleyName.trim());
      setNewAlleyName('');
    } catch (error) {
      // Error is already handled by the mutation's onError with toast
    }
  };

  const handleRemoveAlley = async (name: string) => {
    try {
      await removeAlley.mutateAsync(name);
      setDeleteAlleyDialog(null);
    } catch (error) {
      // Error is already handled by the mutation's onError with toast
    }
  };

  const handleAddGrave = async () => {
    if (!selectedAlley || !newPlotNumber) {
      return;
    }

    try {
      await addGrave.mutateAsync({
        alley: selectedAlley,
        plotNumber: BigInt(newPlotNumber),
      });
      setNewPlotNumber('');
    } catch (error) {
      // Error is already handled by the mutation's onError with toast
    }
  };

  const handleRemoveGrave = async (id: bigint) => {
    try {
      await removeGrave.mutateAsync(id);
      setDeleteGraveDialog(null);
    } catch (error) {
      // Error is already handled by the mutation's onError with toast
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie alejami</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newAlley">Nazwa nowej alei</Label>
              <Input
                id="newAlley"
                value={newAlleyName}
                onChange={(e) => setNewAlleyName(e.target.value)}
                placeholder="np. A, B, 1, 2..."
                disabled={addAlley.isPending}
              />
            </div>
            <Button
              onClick={handleAddAlley}
              disabled={addAlley.isPending || !newAlleyName.trim()}
              className="self-end"
            >
              {addAlley.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj aleję
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Istniejące aleje</Label>
            {cemetery?.alleys.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak alei</p>
            ) : (
              <div className="space-y-2">
                {cemetery?.alleys.map((alley) => (
                  <div
                    key={alley.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Aleja {alley.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {alley.graveIds.length} grobów
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteAlleyDialog(alley.name)}
                      disabled={alley.graveIds.length > 0 || removeAlley.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dodawanie grobów</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alleySelect">Wybierz aleję</Label>
              <select
                id="alleySelect"
                value={selectedAlley}
                onChange={(e) => setSelectedAlley(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={addGrave.isPending}
              >
                <option value="">-- Wybierz --</option>
                {cemetery?.alleys.map((alley) => (
                  <option key={alley.name} value={alley.name}>
                    Aleja {alley.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plotNumber">Numer grobu</Label>
              <Input
                id="plotNumber"
                type="number"
                value={newPlotNumber}
                onChange={(e) => setNewPlotNumber(e.target.value)}
                placeholder="1"
                disabled={addGrave.isPending}
              />
            </div>
          </div>

          <Button
            onClick={handleAddGrave}
            disabled={addGrave.isPending || !selectedAlley || !newPlotNumber}
            className="w-full"
          >
            {addGrave.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Dodaj grób
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteAlleyDialog} onOpenChange={() => setDeleteAlleyDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno usunąć aleję?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Aleja {deleteAlleyDialog} zostanie trwale usunięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAlley.isPending}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAlleyDialog && handleRemoveAlley(deleteAlleyDialog)}
              disabled={removeAlley.isPending}
            >
              {removeAlley.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteGraveDialog} onOpenChange={() => setDeleteGraveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno usunąć grób?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Można usuwać tylko wolne groby.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeGrave.isPending}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGraveDialog && handleRemoveGrave(deleteGraveDialog)}
              disabled={removeGrave.isPending}
            >
              {removeGrave.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
