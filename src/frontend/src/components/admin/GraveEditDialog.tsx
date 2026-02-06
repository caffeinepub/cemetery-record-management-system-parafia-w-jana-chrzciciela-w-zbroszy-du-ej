import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useUpdateGrave, useAddGrave, useGetCemeteryState } from '../../hooks/useQueries';
import type { GraveRecord, DeceasedPerson, GraveOwner } from '../../backend';
import { GraveStatus } from '../../backend';

interface GraveEditDialogProps {
  grave: GraveRecord | null;
  open: boolean;
  onClose: () => void;
}

export default function GraveEditDialog({ grave, open, onClose }: GraveEditDialogProps) {
  const isNew = !grave;
  const { data: cemetery } = useGetCemeteryState();
  const updateGrave = useUpdateGrave();
  const addGrave = useAddGrave();

  const [alley, setAlley] = useState('');
  const [plotNumber, setPlotNumber] = useState('');
  const [status, setStatus] = useState<GraveStatus>(GraveStatus.free);
  const [paymentValidUntil, setPaymentValidUntil] = useState('');
  const [deceasedPersons, setDeceasedPersons] = useState<DeceasedPerson[]>([]);
  const [owner, setOwner] = useState<GraveOwner | null>(null);

  // Reset form state whenever the grave prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (grave) {
        // Editing existing grave - populate all fields
        setAlley(grave.alley);
        setPlotNumber(grave.plotNumber.toString());
        setStatus(grave.status);
        setDeceasedPersons(grave.deceasedPersons);
        setOwner(grave.owner || null);
        
        if (grave.paymentValidUntil) {
          const date = new Date(Number(grave.paymentValidUntil) / 1000000);
          setPaymentValidUntil(date.toISOString().split('T')[0]);
        } else {
          setPaymentValidUntil('');
        }
      } else {
        // Creating new grave - reset to defaults
        setAlley('');
        setPlotNumber('');
        setStatus(GraveStatus.free);
        setPaymentValidUntil('');
        setDeceasedPersons([]);
        setOwner(null);
      }
    }
  }, [grave, open]);

  const handleAddDeceased = () => {
    setDeceasedPersons([
      ...deceasedPersons,
      {
        firstName: '',
        lastName: '',
        yearOfDeath: BigInt(new Date().getFullYear()),
        placeOfDeath: '',
        dateOfDeath: undefined,
      },
    ]);
  };

  const handleRemoveDeceased = (index: number) => {
    setDeceasedPersons(deceasedPersons.filter((_, i) => i !== index));
  };

  const handleDeceasedChange = (index: number, field: keyof DeceasedPerson, value: any) => {
    const updated = [...deceasedPersons];
    updated[index] = { ...updated[index], [field]: value };
    setDeceasedPersons(updated);
  };

  const handleSubmit = async () => {
    if (!alley || !plotNumber) {
      return;
    }

    try {
      if (isNew) {
        await addGrave.mutateAsync({
          alley,
          plotNumber: BigInt(plotNumber),
        });
      } else {
        const updatedRecord: GraveRecord = {
          id: grave!.id,
          alley,
          plotNumber: BigInt(plotNumber),
          status,
          deceasedPersons,
          owner: owner || undefined,
          paymentValidUntil: paymentValidUntil
            ? BigInt(new Date(paymentValidUntil).getTime() * 1000000)
            : undefined,
        };
        await updateGrave.mutateAsync({ id: grave!.id, updatedRecord });
      }
      // Only close on success
      onClose();
    } catch (error: any) {
      // Error is already handled by mutation hooks with toast
      // Dialog stays open so user can correct the issue
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Only trigger onClose when dialog is being closed (not when opening)
    if (!newOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Dodaj nowy grób' : `Edytuj grób - Aleja ${alley}, Grób ${plotNumber}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alley">Aleja *</Label>
              {isNew ? (
                <Select value={alley} onValueChange={setAlley}>
                  <SelectTrigger id="alley">
                    <SelectValue placeholder="Wybierz aleję" />
                  </SelectTrigger>
                  <SelectContent>
                    {cemetery?.alleys.map((a) => (
                      <SelectItem key={a.name} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="alley" value={alley} disabled />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plotNumber">Numer grobu *</Label>
              <Input
                id="plotNumber"
                type="number"
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                disabled={!isNew}
              />
            </div>
          </div>

          {!isNew && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as GraveStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GraveStatus.free}>Wolne</SelectItem>
                    <SelectItem value={GraveStatus.reserved}>Zarezerwowane</SelectItem>
                    <SelectItem value={GraveStatus.paid}>Opłacone</SelectItem>
                    <SelectItem value={GraveStatus.unpaid}>Nieopłacone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentValidUntil">Data ważności opłaty</Label>
                <Input
                  id="paymentValidUntil"
                  type="date"
                  value={paymentValidUntil}
                  onChange={(e) => setPaymentValidUntil(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Osoby spoczywające</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDeceased}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj osobę
                  </Button>
                </div>

                {deceasedPersons.map((person, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Osoba {idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDeceased(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Imię</Label>
                        <Input
                          value={person.firstName}
                          onChange={(e) => handleDeceasedChange(idx, 'firstName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nazwisko</Label>
                        <Input
                          value={person.lastName}
                          onChange={(e) => handleDeceasedChange(idx, 'lastName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rok śmierci</Label>
                        <Input
                          type="number"
                          value={person.yearOfDeath.toString()}
                          onChange={(e) =>
                            handleDeceasedChange(idx, 'yearOfDeath', BigInt(e.target.value || 0))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data śmierci</Label>
                        <Input
                          type="date"
                          value={
                            person.dateOfDeath
                              ? new Date(Number(person.dateOfDeath) / 1000000)
                                  .toISOString()
                                  .split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            handleDeceasedChange(
                              idx,
                              'dateOfDeath',
                              e.target.value
                                ? BigInt(new Date(e.target.value).getTime() * 1000000)
                                : undefined
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Miejsce śmierci</Label>
                        <Input
                          value={person.placeOfDeath}
                          onChange={(e) => handleDeceasedChange(idx, 'placeOfDeath', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Właściciel grobu</Label>
                {!owner ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setOwner({ firstName: '', lastName: '', address: '', phone: undefined })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj właściciela
                  </Button>
                ) : (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Dane właściciela</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setOwner(null)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Imię</Label>
                        <Input
                          value={owner.firstName}
                          onChange={(e) => setOwner({ ...owner, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nazwisko</Label>
                        <Input
                          value={owner.lastName}
                          onChange={(e) => setOwner({ ...owner, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Adres</Label>
                        <Input
                          value={owner.address}
                          onChange={(e) => setOwner({ ...owner, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Telefon (opcjonalnie)</Label>
                        <Input
                          value={owner.phone || ''}
                          onChange={(e) =>
                            setOwner({ ...owner, phone: e.target.value || undefined })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateGrave.isPending || addGrave.isPending}
          >
            {(updateGrave.isPending || addGrave.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isNew ? 'Dodaj' : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
