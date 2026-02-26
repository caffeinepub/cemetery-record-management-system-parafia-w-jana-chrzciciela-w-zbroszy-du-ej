import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { GraveRecord, GraveOwner, DeceasedPerson, AlleyView } from '../../backend';
import { GraveStatus } from '../../backend';
import { useUpdateGrave, useAddGrave, useRemoveGrave, useUpdateGraveLocation, useGetCemeteryState } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { sortAlleys } from '../../utils/alleySort';

interface GraveEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grave: GraveRecord | null; // null = create new
  onSuccess?: () => void;
}

const emptyOwner: GraveOwner = {
  firstName: '',
  lastName: '',
  address: '',
  phone: undefined,
};

const emptyDeceased: DeceasedPerson = {
  firstName: '',
  lastName: '',
  yearOfDeath: BigInt(0),
  dateOfDeath: undefined,
  placeOfDeath: '',
};

export default function GraveEditDialog({ open, onOpenChange, grave, onSuccess }: GraveEditDialogProps) {
  const isEditing = grave !== null;
  const { data: cemetery } = useGetCemeteryState();
  const rawAlleys: AlleyView[] = cemetery?.alleys ?? [];
  // Always show alleys in sorted order
  const alleys = sortAlleys(rawAlleys);

  // Form state
  const [alley, setAlley] = useState('');
  const [plotNumber, setPlotNumber] = useState('');
  const [status, setStatus] = useState<string>('free');
  const [hasOwner, setHasOwner] = useState(false);
  const [owner, setOwner] = useState<GraveOwner>(emptyOwner);
  const [deceasedPersons, setDeceasedPersons] = useState<DeceasedPerson[]>([]);
  const [paymentValidUntil, setPaymentValidUntil] = useState('');

  // Location change tracking
  const [originalAlley, setOriginalAlley] = useState('');
  const [originalPlotNumber, setOriginalPlotNumber] = useState('');

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Plot number change confirmation
  const [showPlotNumberConfirm, setShowPlotNumberConfirm] = useState(false);

  const updateGrave = useUpdateGrave();
  const addGrave = useAddGrave();
  const removeGrave = useRemoveGrave();
  const updateGraveLocation = useUpdateGraveLocation();

  const isSaving = updateGrave.isPending || addGrave.isPending || updateGraveLocation.isPending;
  const isDeleting = removeGrave.isPending;

  // Reset form when grave or open state changes
  useEffect(() => {
    if (!open) return;
    if (grave) {
      setAlley(grave.alley);
      setPlotNumber(String(grave.plotNumber));
      setStatus(grave.status as string);
      setOriginalAlley(grave.alley);
      setOriginalPlotNumber(String(grave.plotNumber));
      if (grave.owner) {
        setHasOwner(true);
        setOwner(grave.owner);
      } else {
        setHasOwner(false);
        setOwner(emptyOwner);
      }
      setDeceasedPersons(grave.deceasedPersons ? [...grave.deceasedPersons] : []);
      if (grave.paymentValidUntil) {
        const date = new Date(Number(grave.paymentValidUntil) / 1_000_000);
        setPaymentValidUntil(date.toISOString().split('T')[0]);
      } else {
        setPaymentValidUntil('');
      }
    } else {
      setAlley(alleys.length > 0 ? alleys[0].name : '');
      setPlotNumber('');
      setStatus('free');
      setOriginalAlley('');
      setOriginalPlotNumber('');
      setHasOwner(false);
      setOwner(emptyOwner);
      setDeceasedPersons([]);
      setPaymentValidUntil('');
    }
  }, [grave, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddDeceased = () => {
    setDeceasedPersons(prev => [...prev, { ...emptyDeceased }]);
  };

  const handleRemoveDeceased = (index: number) => {
    setDeceasedPersons(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeceasedChange = (index: number, field: keyof DeceasedPerson, value: string) => {
    setDeceasedPersons(prev => prev.map((p, i) => {
      if (i !== index) return p;
      if (field === 'yearOfDeath') {
        return { ...p, yearOfDeath: BigInt(value || '0') };
      }
      if (field === 'dateOfDeath') {
        if (!value) return { ...p, dateOfDeath: undefined };
        const ms = new Date(value).getTime();
        return { ...p, dateOfDeath: BigInt(ms) * BigInt(1_000_000) };
      }
      return { ...p, [field]: value };
    }));
  };

  const handleOwnerChange = (field: keyof GraveOwner, value: string) => {
    setOwner(prev => ({ ...prev, [field]: value || undefined }));
  };

  const validate = (): string | null => {
    if (!alley) return 'Wybierz aleję';
    const plotNum = parseInt(plotNumber, 10);
    if (!plotNumber || isNaN(plotNum) || plotNum <= 0) return 'Podaj prawidłowy numer grobu (liczba > 0)';
    if (hasOwner) {
      if (!owner.firstName.trim()) return 'Podaj imię właściciela';
      if (!owner.lastName.trim()) return 'Podaj nazwisko właściciela';
      if (!owner.address.trim()) return 'Podaj adres właściciela';
    }
    for (let i = 0; i < deceasedPersons.length; i++) {
      const p = deceasedPersons[i];
      if (!p.firstName.trim()) return `Podaj imię osoby ${i + 1}`;
      if (!p.lastName.trim()) return `Podaj nazwisko osoby ${i + 1}`;
    }
    return null;
  };

  const executeSave = async () => {
    const plotNum = parseInt(plotNumber, 10);

    if (!isEditing) {
      addGrave.mutate(
        { alley, plotNumber: plotNum },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
      return;
    }

    // Only plot number can be changed via changeGraveNumber.
    // Alley changes are not supported by the backend — the alley field is locked.
    const plotNumberChanged = plotNumber !== originalPlotNumber;

    const buildUpdatedRecord = (): GraveRecord => ({
      ...grave!,
      // Always keep original alley — backend does not support moving graves between alleys
      alley: originalAlley,
      plotNumber: BigInt(plotNum),
      status: status as GraveStatus,
      owner: hasOwner ? owner : undefined,
      deceasedPersons,
      paymentValidUntil: paymentValidUntil
        ? BigInt(new Date(paymentValidUntil).getTime()) * BigInt(1_000_000)
        : undefined,
    });

    if (plotNumberChanged) {
      // First change the plot number via changeGraveNumber, then update the rest
      updateGraveLocation.mutate(
        { id: grave!.id, newAlley: originalAlley, newPlotNumber: plotNum },
        {
          onSuccess: () => {
            const updatedRecord = buildUpdatedRecord();
            updateGrave.mutate(
              { id: grave!.id, record: updatedRecord },
              {
                onSuccess: () => {
                  onOpenChange(false);
                  onSuccess?.();
                },
              }
            );
          },
        }
      );
    } else {
      const updatedRecord = buildUpdatedRecord();
      updateGrave.mutate(
        { id: grave!.id, record: updatedRecord },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    // If editing and plot number has changed, show confirmation first
    if (isEditing && plotNumber !== originalPlotNumber) {
      setShowPlotNumberConfirm(true);
      return;
    }

    await executeSave();
  };

  const handlePlotNumberConfirm = async () => {
    setShowPlotNumberConfirm(false);
    await executeSave();
  };

  const handleDeleteConfirm = () => {
    if (!grave) return;
    removeGrave.mutate(grave.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onOpenChange(false);
        onSuccess?.();
      },
      onError: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const dialogTitle = isEditing
    ? `Edytuj grób — Aleja ${grave.alley}, nr ${grave.plotNumber}`
    : 'Dodaj nowy grób';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Edytuj dane grobu, właściciela i osoby pochowane.'
                : 'Wypełnij dane nowego grobu.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alley">Aleja</Label>
                {isEditing ? (
                  // Alley is locked during editing — backend does not support moving graves
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {originalAlley}
                  </div>
                ) : (
                  <Select value={alley} onValueChange={setAlley}>
                    <SelectTrigger id="alley">
                      <SelectValue placeholder="Wybierz aleję" />
                    </SelectTrigger>
                    <SelectContent>
                      {alleys.map(a => (
                        <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Aleja jest zablokowana — przenoszenie grobów między alejami nie jest obsługiwane.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plotNumber">Numer grobu</Label>
                <Input
                  id="plotNumber"
                  type="number"
                  min="1"
                  value={plotNumber}
                  onChange={e => setPlotNumber(e.target.value)}
                  placeholder="np. 42"
                />
                {isEditing && plotNumber !== originalPlotNumber && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Zmiana numeru — wymagane potwierdzenie
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Wolny</SelectItem>
                  <SelectItem value="reserved">Zarezerwowany</SelectItem>
                  <SelectItem value="paid">Opłacony</SelectItem>
                  <SelectItem value="unpaid">Nieopłacony</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment valid until */}
            {(status === 'paid' || status === 'unpaid') && (
              <div className="space-y-2">
                <Label htmlFor="paymentValidUntil">Opłata ważna do</Label>
                <Input
                  id="paymentValidUntil"
                  type="date"
                  value={paymentValidUntil}
                  onChange={e => setPaymentValidUntil(e.target.value)}
                />
              </div>
            )}

            {/* Owner */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Właściciel grobu</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHasOwner(v => !v)}
                >
                  {hasOwner ? 'Usuń właściciela' : 'Dodaj właściciela'}
                </Button>
              </div>
              {hasOwner && (
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">Imię</Label>
                    <Input
                      value={owner.firstName}
                      onChange={e => handleOwnerChange('firstName', e.target.value)}
                      placeholder="Imię"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nazwisko</Label>
                    <Input
                      value={owner.lastName}
                      onChange={e => handleOwnerChange('lastName', e.target.value)}
                      placeholder="Nazwisko"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Adres</Label>
                    <Input
                      value={owner.address}
                      onChange={e => handleOwnerChange('address', e.target.value)}
                      placeholder="Adres zamieszkania"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Telefon (opcjonalnie)</Label>
                    <Input
                      value={owner.phone ?? ''}
                      onChange={e => handleOwnerChange('phone', e.target.value)}
                      placeholder="+48 000 000 000"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Deceased persons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Osoby pochowane</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDeceased}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj osobę
                </Button>
              </div>
              {deceasedPersons.map((person, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Osoba {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDeceased(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Imię</Label>
                      <Input
                        value={person.firstName}
                        onChange={e => handleDeceasedChange(index, 'firstName', e.target.value)}
                        placeholder="Imię"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nazwisko</Label>
                      <Input
                        value={person.lastName}
                        onChange={e => handleDeceasedChange(index, 'lastName', e.target.value)}
                        placeholder="Nazwisko"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rok śmierci</Label>
                      <Input
                        type="number"
                        value={person.yearOfDeath === BigInt(0) ? '' : String(person.yearOfDeath)}
                        onChange={e => handleDeceasedChange(index, 'yearOfDeath', e.target.value)}
                        placeholder="np. 2020"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data śmierci (opcjonalnie)</Label>
                      <Input
                        type="date"
                        value={
                          person.dateOfDeath
                            ? new Date(Number(person.dateOfDeath) / 1_000_000).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={e => handleDeceasedChange(index, 'dateOfDeath', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Miejsce śmierci</Label>
                      <Input
                        value={person.placeOfDeath}
                        onChange={e => handleDeceasedChange(index, 'placeOfDeath', e.target.value)}
                        placeholder="Miejscowość"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {deceasedPersons.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Brak osób pochowanych</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {/* Delete button — only for existing graves */}
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isDeleting}
                className="sm:mr-auto"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Usuwanie…</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" />Usuń grób</>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Zapisywanie…</>
              ) : (
                'Zapisz'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Usuń grób
            </AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć grób{' '}
              <strong>Aleja {grave?.alley}, nr {grave?.plotNumber?.toString()}</strong>?
              Można usunąć tylko groby o statusie &quot;Wolny&quot;. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Usuń grób
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plot Number Change Confirmation */}
      <AlertDialog open={showPlotNumberConfirm} onOpenChange={setShowPlotNumberConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Zmiana numeru grobu
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Zamierzasz zmienić numer grobu z{' '}
                  <strong className="text-foreground">{originalPlotNumber}</strong> na{' '}
                  <strong className="text-foreground">{plotNumber}</strong>.
                </p>
                <p>
                  Ta operacja zaktualizuje numer grobu. Wszystkie dane (osoby pochowane,
                  właściciel, status, daty płatności) zostaną zachowane.
                </p>
                <p className="font-medium text-foreground">
                  Czy chcesz kontynuować?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlotNumberConfirm}>
              Tak, zmień numer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
