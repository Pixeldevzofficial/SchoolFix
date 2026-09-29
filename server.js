const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'reports.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for optional photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read reports
function readReports() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading reports file:', err);
    return [];
  }
}

// Helper to write reports
function writeReports(reports) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving reports file:', err);
    return false;
  }
}

// Catalog of identified common school maintenance problems
const COMMON_PROBLEMS = [
  {
    category: "Fans & Ventilation",
    items: [
      { type: "Ceiling Fan", defaultUrgency: "Medium", desc: "Wobbly mount, burnt motor smell, or speed regulator failing to adjust speed." },
      { type: "Wall / Exhaust Fan", defaultUrgency: "Low", desc: "Noisy bearing or blade obstruction in restroom/lab ventilation." }
    ]
  },
  {
    category: "Electrical & Lighting",
    items: [
      { type: "Lighting Fixture", defaultUrgency: "Low", desc: "Flickering tube, dead LED panel, or ballast buzz causing poor visibility." },
      { type: "Power Socket", defaultUrgency: "Urgent", desc: "Loose faceplate, sparking plug, or dead outlet interrupting classes." },
      { type: "Switch / Breaker", defaultUrgency: "High", desc: "Stuck rocker switch or tripped circuit breaker in hallway or room." }
    ]
  },
  {
    category: "Furniture & Desks",
    items: [
      { type: "Classroom Desk", defaultUrgency: "Medium", desc: "Splintered desktop, loose screws, bent frame, or missing book rack." },
      { type: "Student Chair", defaultUrgency: "Medium", desc: "Cracked seat shell, wobbly legs, or missing rubber floor glides." },
      { type: "Whiteboard / Chalkboard", defaultUrgency: "Low", desc: "Detached mounting bracket, deep gouges, or damaged frame." }
    ]
  },
  {
    category: "Plumbing & Restroom",
    items: [
      { type: "Plumbing & Toilet", defaultUrgency: "High", desc: "Continuous cistern leak, stuck flush button, or drain blockage." },
      { type: "Washbasin & Tap", defaultUrgency: "Medium", desc: "Dripping faucet, cracked ceramic basin, or disconnected drain P-trap." },
      { type: "Water Dispenser", defaultUrgency: "Medium", desc: "Chiller not cooling, water filter alarm blinking, or drip tray overflow." }
    ]
  },
  {
    category: "Audio-Visual & Tech",
    items: [
      { type: "Projector / AV", defaultUrgency: "High", desc: "Lamp warning shutdown, distorted projection alignment, or HDMI input failure." },
      { type: "Projector Screen", defaultUrgency: "Low", desc: "Motorized screen won't lower, manual pull-cord snapped, or torn fabric." },
      { type: "PA / Sound System", defaultUrgency: "Medium", desc: "Classroom speaker screeching, dead microphone jack, or volume knob broken." }
    ]
  },
  {
    category: "Doors, Windows & Locks",
    items: [
      { type: "Door & Lockset", defaultUrgency: "Medium", desc: "Jammed key cylinder, sagging door rubbing floor, or broken latch." },
      { type: "Window & Latch", defaultUrgency: "Medium", desc: "Stuck louver, cracked window glass pane, or broken safety catch." }
    ]
  }
];

// API: Get common problems catalog
app.get('/api/catalog', (req, res) => {
  res.json({
    success: true,
    data: COMMON_PROBLEMS
  });
});

// API: Get all reports with optional filters
app.get('/api/reports', (req, res) => {
  const { status, category, urgency, search, sort = 'desc' } = req.query;
  let reports = readReports();

  if (status && status !== 'All') {
    reports = reports.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }

  if (category && category !== 'All') {
    reports = reports.filter(r => r.category.toLowerCase() === category.toLowerCase());
  }

  if (urgency && urgency !== 'All') {
    reports = reports.filter(r => r.urgency.toLowerCase() === urgency.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase().trim();
    reports = reports.filter(r => 
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.type && r.type.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(q))
    );
  }

  // Sort by createdAt
  reports.sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    return sort === 'asc' ? tA - tB : tB - tA;
  });

  res.json({
    success: true,
    total: reports.length,
    data: reports
  });
});

// API: Get single report
app.get('/api/reports/:id', (req, res) => {
  const reports = readReports();
  const report = reports.find(r => r.id.toLowerCase() === req.params.id.toLowerCase());
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  res.json({ success: true, data: report });
});

// API: Dashboard stats
app.get('/api/stats', (req, res) => {
  const reports = readReports();
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'Pending').length;
  const inProgress = reports.filter(r => r.status === 'In Progress').length;
  const fixed = reports.filter(r => r.status === 'Fixed').length;
  const urgent = reports.filter(r => (r.urgency === 'Urgent' || r.urgency === 'High') && r.status !== 'Fixed').length;

  // Breakdown by category
  const categories = {};
  reports.forEach(r => {
    const cat = r.category || 'Other';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    success: true,
    stats: {
      total,
      pending,
      inProgress,
      fixed,
      urgent,
      categories
    }
  });
});

// API: Create new report (with optional photo)
app.post('/api/reports', upload.single('photo'), (req, res) => {
  try {
    const { type, category, location, urgency, description, reporterName, reporterRole } = req.body;

    if (!type || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Problem type, location, and description are required.'
      });
    }

    const reports = readReports();

    // Generate readable ID: SF-100X
    let nextNum = 1001;
    if (reports.length > 0) {
      const ids = reports
        .map(r => parseInt(r.id.replace('SF-', ''), 10))
        .filter(n => !isNaN(n));
      if (ids.length > 0) {
        nextNum = Math.max(...ids) + 1;
      }
    }
    const newId = `SF-${nextNum}`;

    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const newReport = {
      id: newId,
      type: type.trim(),
      category: category ? category.trim() : 'General Maintenance',
      location: location.trim(),
      urgency: urgency ? urgency.trim() : 'Normal',
      description: description.trim(),
      reporterName: reporterName ? reporterName.trim() : 'Anonymous',
      reporterRole: reporterRole ? reporterRole.trim() : 'Student',
      status: 'Pending',
      photoUrl: photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: ''
    };

    reports.unshift(newReport);
    writeReports(reports);

    res.status(201).json({
      success: true,
      message: 'Maintenance report successfully submitted.',
      data: newReport
    });
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ success: false, message: 'Server error processing report.' });
  }
});

// API: Update report status and/or admin notes
app.patch('/api/reports/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Fixed'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const reports = readReports();
  const index = reports.findIndex(r => r.id.toLowerCase() === req.params.id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  if (status) {
    reports[index].status = status;
  }
  if (notes !== undefined) {
    reports[index].notes = notes.trim();
  }
  reports[index].updatedAt = new Date().toISOString();

  writeReports(reports);

  res.json({
    success: true,
    message: `Report ${reports[index].id} updated to ${reports[index].status}`,
    data: reports[index]
  });
});

// API: Delete report
app.delete('/api/reports/:id', (req, res) => {
  const reports = readReports();
  const index = reports.findIndex(r => r.id.toLowerCase() === req.params.id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  const removed = reports.splice(index, 1)[0];

  // If photo exists, clean up file
  if (removed.photoUrl) {
    const photoPath = path.join(__dirname, 'public', removed.photoUrl);
    if (fs.existsSync(photoPath)) {
      try {
        fs.unlinkSync(photoPath);
      } catch (err) {
        console.warn('Could not delete photo file:', err.message);
      }
    }
  }

  writeReports(reports);

  res.json({
    success: true,
    message: `Report ${removed.id} deleted successfully.`
  });
});

// Fallback to index.html for client routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`SchoolFix server running on http://localhost:${PORT}`);
});
