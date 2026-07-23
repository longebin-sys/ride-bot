const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Generic read/write functions
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Database operations
const db = {
  // Users
  getUsers: () => readJSON('users.json'),
  saveUsers: (users) => writeJSON('users.json', users),
  
  getUser: (telegramId) => {
    const users = db.getUsers();
    return users.find(u => u.telegram_id === telegramId);
  },
  
  createUser: (user) => {
    const users = db.getUsers();
    const existing = users.find(u => u.telegram_id === user.telegram_id);
    if (existing) return existing;
    const newUser = { ...user, id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5) };
    users.push(newUser);
    db.saveUsers(users);
    return newUser;
  },
  
  updateUser: (telegramId, updates) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.telegram_id === telegramId);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    db.saveUsers(users);
    return users[index];
  },

  // Drivers
  getDrivers: () => readJSON('drivers.json'),
  saveDrivers: (drivers) => writeJSON('drivers.json', drivers),
  
  getDriver: (telegramId) => {
    const drivers = db.getDrivers();
    return drivers.find(d => d.telegram_id === telegramId);
  },
  
  createDriver: (driver) => {
    const drivers = db.getDrivers();
    const newDriver = { ...driver, id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5) };
    drivers.push(newDriver);
    db.saveDrivers(drivers);
    return newDriver;
  },
  
  updateDriver: (telegramId, updates) => {
    const drivers = db.getDrivers();
    const index = drivers.findIndex(d => d.telegram_id === telegramId);
    if (index === -1) return null;
    drivers[index] = { ...drivers[index], ...updates };
    db.saveDrivers(drivers);
    return drivers[index];
  },
  
  getAvailableDrivers: () => {
    const drivers = db.getDrivers();
    return drivers.filter(d => d.status === 'available' && d.current_lat && d.current_lng);
  },

  // Rides
  getRides: () => readJSON('rides.json'),
  saveRides: (rides) => writeJSON('rides.json', rides),
  
  createRide: (ride) => {
    const rides = db.getRides();
    const newRide = { ...ride, id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), created_at: new Date().toISOString() };
    rides.push(newRide);
    db.saveRides(rides);
    return newRide;
  },
  
  getRide: (rideId) => {
    const rides = db.getRides();
    return rides.find(r => r.id === rideId);
  },
  
  updateRide: (rideId, updates) => {
    const rides = db.getRides();
    const index = rides.findIndex(r => r.id === rideId);
    if (index === -1) return null;
    rides[index] = { ...rides[index], ...updates };
    db.saveRides(rides);
    return rides[index];
  },
  
  getPendingRides: () => {
    const rides = db.getRides();
    return rides.filter(r => r.status === 'searching' || r.status === 'requesting');
  }
};

module.exports = db;