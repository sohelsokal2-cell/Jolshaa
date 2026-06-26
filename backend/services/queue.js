const EventEmitter = require('events');

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.processing = new Map();
    this.maxConcurrent = 5;
    this.isRunning = true;
  }

  createQueue(name) {
    if (!this.queues.has(name)) {
      this.queues.set(name, []);
      this.processing.set(name, 0);
    }
    return {
      add: (job) => this.addJob(name, job),
      process: (handler) => this.setHandler(name, handler),
    };
  }

  addJob(queueName, job) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
      this.processing.set(queueName, 0);
    }

    const jobEntry = {
      id: Date.now() + Math.random(),
      data: job,
      status: 'waiting',
      attempts: 0,
      maxAttempts: job.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.queues.get(queueName).push(jobEntry);
    this.processQueue(queueName);
    return jobEntry;
  }

  setHandler(queueName, handler) {
    if (!this.handlers) this.handlers = {};
    this.handlers[queueName] = handler;
  }

  async processQueue(queueName) {
    if (!this.isRunning) return;
    if (!this.handlers || !this.handlers[queueName]) return;
    if (this.processing.get(queueName) >= this.maxConcurrent) return;

    const queue = this.queues.get(queueName);
    const job = queue.find(j => j.status === 'waiting');
    if (!job) return;

    this.processing.set(queueName, this.processing.get(queueName) + 1);
    job.status = 'processing';
    job.attempts += 1;

    try {
      await this.handlers[queueName](job.data);
      job.status = 'completed';
    } catch (err) {
      if (job.attempts < job.maxAttempts) {
        job.status = 'waiting';
        setTimeout(() => this.processQueue(queueName), 1000 * job.attempts);
      } else {
        job.status = 'failed';
        job.error = err.message;
      }
    } finally {
      this.processing.set(queueName, this.processing.get(queueName) - 1);
      this.processQueue(queueName);
    }
  }

  getStats() {
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = {
        waiting: queue.filter(j => j.status === 'waiting').length,
        processing: this.processing.get(name),
        completed: queue.filter(j => j.status === 'completed').length,
        failed: queue.filter(j => j.status === 'failed').length,
      };
    }
    return stats;
  }

  cleanup() {
    for (const [name, queue] of this.queues) {
      const completed = queue.filter(j => j.status === 'completed' || j.status === 'failed');
      completed.forEach(job => {
        const index = queue.indexOf(job);
        if (index > -1) queue.splice(index, 1);
      });
    }
  }

  stop() {
    this.isRunning = false;
  }
}

const queue = new JobQueue();

const notificationQueue = queue.createQueue('notifications');
const mediaQueue = queue.createQueue('media');
const analyticsQueue = queue.createQueue('analytics');
const cleanupQueue = queue.createQueue('cleanup');

module.exports = {
  queue,
  notificationQueue,
  mediaQueue,
  analyticsQueue,
  cleanupQueue,
};
