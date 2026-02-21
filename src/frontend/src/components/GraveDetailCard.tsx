import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicTileData, PublicGraveResult, DeceasedPerson } from '../backend';
import { GraveStatus } from '../backend';
import { getStatusLabel } from '../utils/graveStatusStyles';

interface GraveDetailCardProps {
  grave: PublicTileData | PublicGraveResult | null;
  open: boolean;
  onClose: () => void;
}

function isPublicTileData(grave: PublicTileData | PublicGraveResult): grave is PublicTileData {
  return 'deceasedPersons' in grave && Array.isArray(grave.deceasedPersons);
}

function getCardBackgroundClass(status: GraveStatus): string {
  const backgrounds: Record<GraveStatus, string> = {
    [GraveStatus.paid]: 'bg-green-100 dark:bg-green-900 border-green-500',
    [GraveStatus.unpaid]: 'bg-red-100 dark:bg-red-900 border-red-500',
    [GraveStatus.reserved]: 'bg-orange-100 dark:bg-orange-900 border-orange-500',
    [GraveStatus.free]: 'bg-background border-border',
  };
  return backgrounds[status];
}

function getPaymentMessage(status: GraveStatus): { message: string; show: boolean } {
  const messages: Record<GraveStatus, { message: string; show: boolean }> = {
    [GraveStatus.paid]: { message: 'Dziękujemy za opłacenie grobu', show: true },
    [GraveStatus.unpaid]: { message: 'Prosimy o uregulowanie opłaty za grób', show: true },
    [GraveStatus.reserved]: { message: '', show: false },
    [GraveStatus.free]: { message: '', show: false },
  };
  return messages[status];
}

function getPaymentMessageClass(status: GraveStatus): string {
  const classes: Record<GraveStatus, string> = {
    [GraveStatus.paid]: 'bg-green-600 text-white',
    [GraveStatus.unpaid]: 'bg-red-600 text-white',
    [GraveStatus.reserved]: 'bg-orange-600 text-white',
    [GraveStatus.free]: 'bg-muted text-foreground',
  };
  return classes[status];
}

function formatDate(timestamp?: bigint): string | null {
  if (!timestamp) return null;
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('pl-PL');
}

export default function GraveDetailCard({ grave, open, onClose }: GraveDetailCardProps) {
  if (!grave) return null;

  const status = grave.status;
  const alley = grave.alley;
  const plotNumber = grave.plotNumber;
  const paymentInfo = getPaymentMessage(status);

  let deceasedPersons: DeceasedPerson[] = [];
  
  if (isPublicTileData(grave)) {
    deceasedPersons = grave.deceasedPersons;
  } else {
    // PublicGraveResult - create a single deceased person from the result
    deceasedPersons = [{
      firstName: grave.firstName,
      lastName: grave.lastName,
      yearOfDeath: grave.yearOfDeath ? BigInt(grave.yearOfDeath) : BigInt(0),
      dateOfDeath: undefined,
      placeOfDeath: '',
    }];
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className={`max-w-2xl ${getCardBackgroundClass(status)} border-2 shadow-2xl`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">
                Aleja {alley}, Grób nr {plotNumber.toString()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Payment Status Message */}
          {paymentInfo.show && (
            <div className={`${getPaymentMessageClass(status)} px-6 py-4 rounded-lg text-center font-bold text-lg shadow-md`}>
              {paymentInfo.message}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Status:</span>
            <Badge 
              variant={status === GraveStatus.paid ? 'default' : status === GraveStatus.unpaid ? 'destructive' : 'secondary'}
              className="font-semibold px-4 py-1 text-base"
            >
              {getStatusLabel(status)}
            </Badge>
          </div>

          {/* Deceased Persons */}
          {deceasedPersons.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Osoby spoczywające:
              </h3>
              <div className="space-y-3">
                {deceasedPersons.map((person, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-slate-800 border border-border rounded-lg p-4 shadow-sm"
                  >
                    <p className="font-bold text-lg">
                      {person.firstName} {person.lastName}
                    </p>
                    {(person.dateOfDeath || person.yearOfDeath > 0) && (
                      <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {person.dateOfDeath 
                          ? formatDate(person.dateOfDeath) 
                          : `Rok śmierci: ${person.yearOfDeath.toString()}`}
                      </p>
                    )}
                    {person.placeOfDeath && (
                      <p className="text-muted-foreground mt-1">
                        Miejsce śmierci: {person.placeOfDeath}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {deceasedPersons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground italic">
              Brak informacji o osobach spoczywających w tym grobie
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
