import { useMemo, useState } from 'react';
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
import { sortAlleys } from '../../utils/alleySort';

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

  // Sort alleys client-side for consistent display order
  const sortedAlleys = useMemo(() => {
    if (!cemetery) return [];
    return sortAlleys(cemetery.alleys);
  }, [cemetery]);

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
        plotNumber: Number(newPlotNumber),
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

  if (!cemetery) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nie można załadować danych cmentarza.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Add Alley */}
        <Card>
          <CardHeader>
            <CardTitle>Zarządzanie alejami</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="newAlleyName">Nazwa nowej alei</Label>
                <Input
                  id="newAlleyName"
                  value={newAlleyName}
                  onChange={(e) => setNewAlleyName(e.target.value)}
                  placeholder="np. A, B, 1, 2, Północna..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAlley()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddAlley}
                  disabled={!newAlleyName.trim() || addAlley.isPending}
                >
                  {addAlley.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Dodaj aleję
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Istniejące aleje ({sortedAlleys.length})
              </Label>
              {sortedAlleys.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Brak alei. Dodaj pierwszą aleję powyżej.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {sortedAlleys.map((alley) => (
                    <div
                      key={alley.name}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div>
                        <span className="font-medium">Aleja {alley.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({alley.graveIds.length} {alley.graveIds.length === 1 ? 'grób' : 'grobów'})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAlleyDialog(alley.name)}
                        disabled={alley.graveIds.length > 0 || removeAlley.isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={alley.graveIds.length > 0 ? 'Usuń najpierw wszystkie groby z tej alei' : 'Usuń aleję'}
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

        {/* Add Grave */}
        <Card>
          <CardHeader>
            <CardTitle>Dodaj grób do alei</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedAlleys.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Najpierw dodaj aleję.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="selectedAlley">Aleja</Label>
                    <select
                      id="selectedAlley"
                      value={selectedAlley}
                      onChange={(e) => setSelectedAlley(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Wybierz aleję</option>
                      {sortedAlleys.map((alley) => (
                        <option key={alley.name} value={alley.name}>
                          Aleja {alley.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPlotNumber">Numer grobu</Label>
                    <Input
                      id="newPlotNumber"
                      type="number"
                      min="1"
                      value={newPlotNumber}
                      onChange={(e) => setNewPlotNumber(e.target.value)}
                      placeholder="np. 1, 2, 3..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGrave()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddGrave}
                  disabled={!selectedAlley || !newPlotNumber || addGrave.isPending}
                >
                  {addGrave.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Dodaj grób
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Alley details with graves */}
        {sortedAlleys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Groby w alejach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedAlleys.map((alley) => (
                <div key={alley.name} className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Aleja {alley.name} — {alley.graveIds.length} {alley.graveIds.length === 1 ? 'grób' : 'grobów'}
                  </h4>
                  {alley.graveIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {[...alley.graveIds]
                        .sort((a, b) => Number(a) - Number(b))
                        .map((graveId) => (
                          <div
                            key={graveId.toString()}
                            className="flex items-center gap-1 bg-muted/50 border rounded px-2 py-1 text-xs"
                          >
                            <span>#{graveId.toString()}</span>
                            <button
                              onClick={() => setDeleteGraveDialog(graveId)}
                              className="text-destructive hover:text-destructive/80 ml-1"
                              title="Usuń grób"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Brak grobów w tej alei.</p>
                  )}
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Alley Confirmation */}
      <AlertDialog open={!!deleteAlleyDialog} onOpenChange={(open) => !open && setDeleteAlleyDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń aleję</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć aleję <strong>{deleteAlleyDialog}</strong>?
              Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAlleyDialog && handleRemoveAlley(deleteAlleyDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAlley.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Usuń aleję
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Grave Confirmation */}
      <AlertDialog open={!!deleteGraveDialog} onOpenChange={(open) => !open && setDeleteGraveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń grób</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć grób <strong>#{deleteGraveDialog?.toString()}</strong>?
              Można usunąć tylko groby o statusie &quot;Wolny&quot;. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGraveDialog !== null && handleRemoveGrave(deleteGraveDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeGrave.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Usuń grób
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
