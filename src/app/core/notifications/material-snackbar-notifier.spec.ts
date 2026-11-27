import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MaterialSnackbarNotifier } from './material-snackbar-notifier';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

describe('MaterialSnackbarNotifier', () => {
  let notifier: MaterialSnackbarNotifier;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let dismissedSubject: Subject<void>;
  let actionSubject: Subject<void>;

  beforeEach(() => {
    dismissedSubject = new Subject<void>();
    actionSubject = new Subject<void>();

    mockSnackBar = {
      open: vi.fn().mockReturnValue({
        afterDismissed: () => dismissedSubject.asObservable(),
        onAction: () => actionSubject.asObservable(),
        dismiss: vi.fn(),
      }),
    };

    TestBed.configureTestingModule({
      providers: [MaterialSnackbarNotifier, { provide: MatSnackBar, useValue: mockSnackBar }],
    });

    notifier = TestBed.inject(MaterialSnackbarNotifier);
  });

  it('opens snackbar with appropriate level class, duration and politeness', () => {
    notifier.info('info.key');
    expect(mockSnackBar.open).toHaveBeenCalledWith('info.key', undefined, {
      duration: 4000,
      panelClass: ['snackbar-info'],
      politeness: 'polite',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });

    notifier.error('error.key');
    expect(mockSnackBar.open).toHaveBeenCalledWith('error.key', undefined, {
      duration: 7000,
      panelClass: ['snackbar-error'],
      politeness: 'assertive',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  });

  it('deduplicates notifications with the same dedupeKey while active', () => {
    notifier.show({
      level: 'info',
      messageKey: 'msg.key',
      dedupeKey: 'unique-key-1',
    });
    expect(mockSnackBar.open).toHaveBeenCalledTimes(1);

    // Call again with the same dedupeKey while active
    notifier.show({
      level: 'info',
      messageKey: 'msg.key',
      dedupeKey: 'unique-key-1',
    });
    expect(mockSnackBar.open).toHaveBeenCalledTimes(1);

    // Dismiss active notification
    dismissedSubject.next();

    // Call again after dismissal -> allowed
    notifier.show({
      level: 'info',
      messageKey: 'msg.key',
      dedupeKey: 'unique-key-1',
    });
    expect(mockSnackBar.open).toHaveBeenCalledTimes(2);
  });
});
