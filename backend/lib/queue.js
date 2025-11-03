const { sendEmail } = require('./postmarkClient');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Try to initialize BullMQ (optional - requires Redis)
let emailQueue = null;
let emailWorker = null;
let queueEnabled = false;

// Check if Redis is available before initializing BullMQ
if (process.env.REDIS_ENABLED === 'true') {
  try {
    const { Queue, Worker } = require('bullmq');
    
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };

    emailQueue = new Queue('email-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    });

    emailWorker = new Worker(
      'email-queue',
      async (job) => {
        const { emailId, ...emailData } = job.data;

        console.log(`📧 Processing email job: ${job.id}, Email ID: ${emailId}`);

        try {
          const result = await sendEmail(emailData);

          if (result.success) {
            await prisma.email.update({
              where: { id: emailId },
              data: {
                status: 'SENT',
                postmarkId: result.messageId,
                updatedAt: new Date(),
              },
            });

            console.log(`✅ Email sent: ${emailId}, Postmark ID: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
          } else {
            throw new Error(result.error || 'Failed to send email');
          }
        } catch (error) {
          console.error(`❌ Email send failed: ${emailId}`, error);

          if (job.attemptsMade >= (job.opts.attempts || 3)) {
            await prisma.email.update({
              where: { id: emailId },
              data: { status: 'FAILED', updatedAt: new Date() },
            });
          }

          throw error;
        }
      },
      { connection, concurrency: 5 }
    );

    emailWorker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    queueEnabled = true;
    console.log('✅ Email queue initialized (Redis connected)');
  } catch (error) {
    console.warn('⚠️  Failed to initialize email queue:', error.message);
    queueEnabled = false;
  }
} else {
  console.log('ℹ️  Email queue disabled (REDIS_ENABLED != true). Emails will be sent synchronously.');
}

/**
 * Add email to queue (or send immediately if queue disabled)
 */
async function queueEmail(emailId, emailData) {
  if (queueEnabled && emailQueue) {
    const job = await emailQueue.add('send-email', {
      emailId,
      ...emailData,
    });

    console.log(`📬 Email queued: Job ID ${job.id}, Email ID ${emailId}`);
    return job;
  } else {
    // Send immediately if queue is disabled
    console.log(`📧 Sending email immediately (queue disabled): Email ID ${emailId}`);
    
    try {
      const result = await sendEmail(emailData);

      if (result.success) {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'SENT',
            postmarkId: result.messageId,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Email sent: ${emailId}, Postmark ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else {
        await prisma.email.update({
          where: { id: emailId },
          data: { status: 'FAILED', updatedAt: new Date() },
        });
        
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error(`❌ Email send failed: ${emailId}`, error);
      throw error;
    }
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  if (!queueEnabled || !emailQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      queueEnabled: false,
    };
  }

  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
    queueEnabled: true,
  };
}

module.exports = {
  emailQueue,
  emailWorker,
  queueEmail,
  getQueueStats,
};

