/**
 * One-time migration script: converts legacy free-text work/education strings
 * into structured workHistory/educationHistory array entries.
 *
 * Run:  node scripts/migrate-work-education.js
 *
 * Safe to run multiple times — skips users already migrated.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found in environment. Set it in .env or export it.');
  process.exit(1);
}

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  work: String,
  education: String,
  workHistory: [{ type: mongoose.Schema.Types.Mixed }],
  educationHistory: [{ type: mongoose.Schema.Types.Mixed }]
}));

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({
    $or: [
      { workHistory: { $exists: false } },
      { educationHistory: { $exists: false } },
      { workHistory: { $size: 0 }, work: { $ne: '' } },
      { educationHistory: { $size: 0 }, education: { $ne: '' } }
    ]
  }).select('name work education workHistory educationHistory');

  console.log(`Found ${users.length} users to migrate`);

  let migrated = 0;

  for (const user of users) {
    const updates = {};

    // Migrate work string → workHistory
    if (user.work && (!user.workHistory || user.workHistory.length === 0)) {
      updates.workHistory = [{
        company: user.work,
        position: '',
        location: '',
        startDate: null,
        endDate: null,
        isCurrent: false,
        description: ''
      }];
    }

    // Migrate education string → educationHistory
    if (user.education && (!user.educationHistory || user.educationHistory.length === 0)) {
      updates.educationHistory = [{
        institution: user.education,
        degree: '',
        fieldOfStudy: '',
        startDate: null,
        endDate: null,
        isCurrent: false,
        description: ''
      }];
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: updates });
      migrated++;
      console.log(`  Migrated: ${user.name} (${user._id})`);
    }
  }

  console.log(`\nMigration complete. ${migrated} users updated.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
