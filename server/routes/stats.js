const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../db/database');

const router = express.Router();

// GET /api/stats — accurate storage from database + server resources
router.get('/', (req, res) => {
  const works = db.getWorks();

  // Sum actual file sizes from work records
  const totalUsedBytes = works.reduce((sum, w) => sum + (w.file_size || 0), 0);

  // Server resources
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const cpuPercent = Math.round(cpus.reduce((s, c) => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return s + ((total - c.times.idle) / total) * 100;
  }, 0) / cpus.length);

  res.json({
    usedBytes: totalUsedBytes,
    usedMB: (totalUsedBytes / (1024 * 1024)).toFixed(1),
    usedGB: (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2),
    server: {
      memory: {
        totalMB: Math.round(totalMem / (1024 * 1024)),
        usedMB: Math.round(usedMem / (1024 * 1024)),
        freeMB: Math.round(freeMem / (1024 * 1024)),
        percentUsed: ((usedMem / totalMem) * 100).toFixed(1),
      },
      cpu: { cores: cpus.length, percent: cpuPercent },
      uptime: Math.floor(os.uptime()),
    },
  });
});

module.exports = router;
