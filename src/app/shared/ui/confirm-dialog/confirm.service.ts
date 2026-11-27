import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  async ask(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '420px',
      disableClose: true,
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return Boolean(result);
  }
}
