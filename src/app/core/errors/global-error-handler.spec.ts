import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandler } from './global-error-handler';
import { ERROR_MAPPER } from './error-mapper.port';
import { GraphqlErrorMapper } from './graphql-error-mapper';
import { ERROR_REPORTER } from './error-reporter.port';
import { NOTIFIER } from '../notifications/notifier.port';
import { FakeNotifier } from '../testing/fake-notifier';
import { FakeClock } from '../testing/fake-clock';
import { CLOCK } from '../time/clock.port';
import { AppError } from './app-error';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let fakeNotifier: FakeNotifier;
  let fakeClock: FakeClock;
  const reportedErrors: AppError[] = [];

  beforeEach(() => {
    reportedErrors.length = 0;
    fakeNotifier = new FakeNotifier();
    fakeClock = new FakeClock();

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: ERROR_MAPPER, useClass: GraphqlErrorMapper },
        {
          provide: ERROR_REPORTER,
          useValue: {
            report: (err: AppError) => reportedErrors.push(err),
          },
        },
        { provide: NOTIFIER, useValue: fakeNotifier },
        { provide: CLOCK, useValue: fakeClock },
      ],
    });

    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('notifies and reports error', () => {
    handler.handleError(new AppError('FORBIDDEN', 'errors.FORBIDDEN'));

    expect(reportedErrors).toHaveLength(1);
    expect(reportedErrors[0].code).toBe('FORBIDDEN');
    expect(fakeNotifier.notifications).toHaveLength(1);
    expect(fakeNotifier.notifications[0].messageKey).toBe('errors.FORBIDDEN');
  });

  it('does not notify for NETWORK_OFFLINE', () => {
    handler.handleError(new AppError('NETWORK_OFFLINE', 'errors.NETWORK_OFFLINE'));

    expect(reportedErrors).toHaveLength(1);
    expect(fakeNotifier.notifications).toHaveLength(0);
  });

  it('deduplicates identical errors within 3 seconds', () => {
    const error = new AppError('CONFLICT', 'errors.CONFLICT');

    handler.handleError(error);
    expect(fakeNotifier.notifications).toHaveLength(1);

    // 1 second later: same error suppressed
    fakeClock.advanceMs(1000);
    handler.handleError(error);
    expect(fakeNotifier.notifications).toHaveLength(1);

    // 3.1 seconds later: error notified again
    fakeClock.advanceMs(2500);
    handler.handleError(error);
    expect(fakeNotifier.notifications).toHaveLength(2);
  });
});
