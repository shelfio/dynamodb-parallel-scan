import {inspect} from 'util';
import {Blocker} from './blocker';

it('should return same promise after sequent block() calls', () => {
  const blocker = new Blocker();

  blocker.block();

  const oldPromise = blocker.get();

  blocker.block();

  const newPromise = blocker.get();

  expect(newPromise === oldPromise).toBeTruthy();
});

it('should return pending promise after block()', () => {
  const blocker = new Blocker();

  blocker.block();

  const inspectedBlocker = inspect(blocker.get());
  const isInspectedBlockerPending = inspectedBlocker.includes('pending');

  expect(isInspectedBlockerPending).toBeTruthy();
});

it('should return resolved promise after unblock()', () => {
  const blocker = new Blocker();

  blocker.unblock();

  const inspectedBlocker = inspect(blocker.get());
  const isInspectedBlockerResolved = inspectedBlocker.includes('undefined');

  expect(isInspectedBlockerResolved).toBeTruthy();
});

it('should return resolved promise in default state', () => {
  const blocker = new Blocker();

  const inspectedBlocker = inspect(blocker.get());
  const isInspectedBlockerResolved = inspectedBlocker.includes('undefined');

  expect(isInspectedBlockerResolved).toBeTruthy();
});

it('should be blocked after block() call', () => {
  const blocker = new Blocker();

  blocker.block();

  expect(blocker.isBlocked()).toBeTruthy();
});

it('should not be blocked after unblock() call', () => {
  const blocker = new Blocker();

  blocker.unblock();
  blocker.unblock();

  expect(blocker.isBlocked()).toBeFalsy();
});

it('should not be blocked in default state', () => {
  const blocker = new Blocker();

  expect(blocker.isBlocked()).toBeFalsy();
});
