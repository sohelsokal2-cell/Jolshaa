const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.join(__dirname, '../../backups');

class BackupService {
  static async createBackup(type = 'full') {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${timestamp}`;
    const filepath = path.join(BACKUP_DIR, `${filename}.json`);

    try {
      const mongoose = require('mongoose');
      const collections = mongoose.connection.db.listCollections();

      const backup = {
        type,
        timestamp: new Date(),
        database: mongoose.connection.db.databaseName,
        collections: {},
      };

      for (const coll of await collections) {
        const collection = mongoose.connection.db.collection(coll.name);
        backup.collections[coll.name] = await collection.find({}).toArray();
      }

      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

      return {
        success: true,
        filename,
        filepath,
        size: fs.statSync(filepath).size,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static async restoreBackup(filepath) {
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      const mongoose = require('mongoose');

      for (const [collName, docs] of Object.entries(data.collections)) {
        if (docs.length > 0) {
          const collection = mongoose.connection.db.collection(collName);
          await collection.deleteMany({});
          await collection.insertMany(docs);
        }
      }

      return { success: true, collections: Object.keys(data.collections).length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return [];

    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        filename: f,
        filepath: path.join(BACKUP_DIR, f),
        size: fs.statSync(path.join(BACKUP_DIR, f)).size,
        createdAt: fs.statSync(BACKUP_DIR + '/' + f).birthtime,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static deleteBackup(filename) {
    const filepath = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }
}

module.exports = BackupService;
