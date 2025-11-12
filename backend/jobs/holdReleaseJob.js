const { Queue, Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const {
  getDateRange,
  ensureInventoryRow,
  releaseInventory,
} = require('../lib/inventoryUtils');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Environment-specific queue prefix (to separate staging/prod on same Redis instance)
const QUEUE_PREFIX = process.env.QUEUE_PREFIX || process.env.NODE_ENV || 'default';
const HOLD_RELEASE_QUEUE = `${QUEUE_PREFIX}-hold-release-queue`;
const HOLD_RELEASE_JOB_NAME = 'release-expired-holds';
const HOLD_RELEASE_INTERVAL_MS = parseInt(process.env.HOLD_RELEASE_INTERVAL_MS || '60000', 10);
const HOLD_RELEASE_BATCH_SIZE = parseInt(process.env.HOLD_RELEASE_BATCH_SIZE || '50', 10);

let holdReleaseQueue = null;
let holdReleaseWorker = null;

function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
  };
}

async function processExpiredHolds(batchSize = HOLD_RELEASE_BATCH_SIZE) {
  const now = new Date();

  const expiredHolds = await getPrisma().booking.findMany({
    where: {
      status: 'HOLD',
      holdExpiresAt: { lt: now },
    },
    include: {
      property: true,
      roomType: true,
    },
    orderBy: { holdExpiresAt: 'asc' },
    take: batchSize,
  });

  let releasedCount = 0;
  const failures = [];

  for (const booking of expiredHolds) {
    try {
      const result = await getPrisma().$transaction(async (tx) => {
        const freshBooking = await tx.booking.findUnique({
          where: { id: booking.id },
          include: {
            property: true,
            roomType: true,
          },
        });

        if (
          !freshBooking ||
          freshBooking.status !== 'HOLD' ||
          !freshBooking.holdExpiresAt ||
          freshBooking.holdExpiresAt > now
        ) {
          return { released: false, reason: 'hold_not_expired' };
        }

        // Lock booking row
        await tx.$queryRaw`SELECT id FROM "bookings" WHERE "id" = ${freshBooking.id} FOR UPDATE`;

        const stayDates = getDateRange(freshBooking.checkIn, freshBooking.checkOut);
        const property = freshBooking.property;
        const roomType = freshBooking.roomType;

        for (const date of stayDates) {
          const inventory = await ensureInventoryRow(tx, property, roomType, date);
          await releaseInventory(tx, inventory, freshBooking.rooms, freshBooking.id, freshBooking.holdToken, 'HOLD');
        }

        await tx.inventoryLock.updateMany({
          where: {
            bookingId: freshBooking.id,
            type: 'HOLD',
            releasedAt: null,
          },
          data: {
            releasedAt: new Date(),
          },
        });

        await tx.holdLog.updateMany({
          where: { holdToken: freshBooking.holdToken },
          data: {
            status: 'EXPIRED',
            updatedAt: new Date(),
          },
        });

        const releaseMetadata = {
          ...(freshBooking.externalConfirmation || {}),
          holdReleasedAt: now.toISOString(),
          holdReleaseReason: 'TTL_EXPIRED',
        };

        await tx.booking.update({
          where: { id: freshBooking.id },
          data: {
            status: 'FAILED',
            holdExpiresAt: null,
            updatedAt: new Date(),
            externalConfirmation: releaseMetadata,
          },
        });

        return { released: true };
      }, { isolationLevel: 'Serializable' });

      if (result.released) {
        releasedCount += 1;
      }
    } catch (error) {
      console.error(`❌ Error releasing hold for booking ${booking.id}:`, error);
      failures.push({
        bookingId: booking.id,
        error: error.message,
      });
    }
  }

  return {
    processed: expiredHolds.length,
    released: releasedCount,
    failures,
    checkedAt: now.toISOString(),
  };
}

function initHoldReleaseJob() {
  try {
    const bufferFeatureEnabled = process.env.FEATURE_BUFFER === 'true';
    const redisEnabled = process.env.REDIS_ENABLED === 'true';

    if (!bufferFeatureEnabled) {
      console.log('ℹ️  Hold release job skipped (FEATURE_BUFFER disabled).');
      return;
    }

    if (!redisEnabled) {
      console.log('ℹ️  Hold release job skipped (REDIS_ENABLED != true).');
      return;
    }

    if (holdReleaseQueue || holdReleaseWorker) {
      return;
    }

    const connection = getRedisConnection();

    // Try to create Queue and Worker - if Redis is unavailable, this will throw
    holdReleaseQueue = new Queue(HOLD_RELEASE_QUEUE, {
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: {
          age: 3 * 24 * 3600,
        },
      },
    });

    holdReleaseWorker = new Worker(
      HOLD_RELEASE_QUEUE,
      async () => {
        const summary = await processExpiredHolds();
        if (summary.released > 0) {
          console.log(`🔔 Released ${summary.released} expired holds (checked ${summary.processed}).`);
        }
        return summary;
      },
      {
        connection,
        concurrency: 1,
      }
    );

    holdReleaseWorker.on('failed', (job, err) => {
      console.error(`❌ Hold release job ${job?.id} failed:`, err);
    });

    holdReleaseWorker.on('completed', (job) => {
      const result = job.returnvalue;
      if (result && result.released) {
        console.log(`✅ Hold release job ${job.id} completed. Released: ${result.released}`);
      }
    });

    holdReleaseQueue.add(
      HOLD_RELEASE_JOB_NAME,
      {},
      {
        jobId: HOLD_RELEASE_JOB_NAME,
        repeat: {
          every: HOLD_RELEASE_INTERVAL_MS,
        },
        removeOnComplete: true,
        removeOnFail: {
          age: 3 * 24 * 3600,
        },
      }
    );

    console.log(
      `🕒 Hold release job scheduled every ${Math.round(HOLD_RELEASE_INTERVAL_MS / 1000)} seconds. Queue: ${HOLD_RELEASE_QUEUE}`
    );
  } catch (error) {
    console.error('❌ Error initializing hold release job:', error.message);
    console.error('Hold release job will be disabled. Server will continue to run.');
    // Don't throw - allow server to continue without hold release job
    holdReleaseQueue = null;
    holdReleaseWorker = null;
  }
}

module.exports = {
  initHoldReleaseJob,
  processExpiredHolds,
  holdReleaseQueue,
  holdReleaseWorker,
};

