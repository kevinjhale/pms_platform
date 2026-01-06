#!/usr/bin/env bun
/**
 * Background job scheduler for PMS Platform
 *
 * Usage:
 *   bun run scheduler        - Start the scheduler daemon
 *   bun run scheduler:once   - Run all jobs once and exit
 *
 * This script handles:
 *   - Rent payment reminders (3 days before, on due date)
 *   - Late payment notifications
 *   - Lease expiry notifications (30, 14, 7 days before)
 *   - Payment status updates (upcoming -> due -> late)
 */

import { startScheduler, runAllJobs, stopScheduler } from '../src/services/scheduler';

const args = process.argv.slice(2);
const runOnce = args.includes('--once') || args.includes('-o');

console.log('╔════════════════════════════════════════════╗');
console.log('║     PMS Platform - Background Scheduler    ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');

if (runOnce) {
  console.log('Running all jobs once...\n');
  runAllJobs();

  // Give time for async operations to complete
  setTimeout(() => {
    console.log('\nDone.');
    process.exit(0);
  }, 5000);
} else {
  console.log('Starting scheduler daemon...\n');
  startScheduler();

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\nReceived shutdown signal...');
    stopScheduler();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('\nScheduler is running. Press Ctrl+C to stop.');
}
