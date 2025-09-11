const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./infiniti.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      images TEXT,
      stock TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const saltRounds = 10;
  const defaultAdmin = { username: 'admin', password: 'newSecurePassword', role: 'admin' };
  db.get("SELECT * FROM users WHERE username = ?", [defaultAdmin.username], (err, row) => {
    if (!row) {
      bcrypt.hash(defaultAdmin.password, saltRounds, (err, hash) => {
        if (err) throw err;
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [defaultAdmin.username, hash, defaultAdmin.role]);
      });
    }
  });

  const stmt = db.prepare("INSERT OR IGNORE INTO products (name, sku, description, price, category, images, stock) VALUES (?, ?, ?, ?, ?, ?, ?)");
  [
    ["G37 Headlight", "Infiniti 0001", "Infiniti OEM headlight in great condition. Looking to sell as a pair but will sell separately shipping available.", 499, "Headlights", "[]", "limited"],
    ["RGB LED EMBLEM", "Infiniti 0002", "These LED emblems are custom illuminated accessories designed to enhance your vehicle's appearance.", 159, "Emblems", "[]", "20"],
    ["Q50 Headlight", "Infiniti 0003", "Customize Infiniti headlight, fit on 14-22", 799, "Headlights", "[]", "Very limited"],
    ["Ecutek", "Infiniti 0004", "Provides a custom tuning and remapping software for vehicle ECUs, allowing professional tuners to remap the engine and transmission control units to deliver OEM-like performance and enable custom modifications", 199, "Tuning", "[]", "20"],
    ["Brake Kit", "Infiniti 0005", "Racing brake kit both front and rear disc. 6 pistons in the front and 4 pistons in the rear", 699, "Brakes", "[]", "Limited"],
    ["Steering Wheel", "Infiniti 0006", "Complete carbon fiber steering wheel", 359, "Interior", "[]", "5"],
    ["Steering Wheel", "Infiniti 0007", "Complete carbon fiber steering wheel", 359, "Interior", "[]", "5"],
    ["Steering Wheel", "Infiniti 0008", "Complete carbon fiber steering wheel", 359, "Interior", "[]", "5"],
    ["Steering Wheel", "Infiniti 0009", "Complete carbon fiber steering wheel", 359, "Interior", "[]", "5"],
    ["Tail light", "Infiniti 0010", "Dark tail light", 286, "Lights", "[]", ""],
    ["Q50/Q60 Rear Diffuser", "Infiniti 0011", "Real Carbon fiber rear diffuser. Fits on 14-22", 198, "Exterior", "[]", "Very limited"],
    ["Tesla Style Screen", "Infiniti 0012", "G37 fits in 07-13", 359, "Interior", "[]", "Limited Stock"],
    ["Mark 7", "Infiniti 0013", "", 557, "Unknown", "[]", ""],
    ["Fender", "Infiniti 0014", "Q50 carbon fiber fender", 789, "Exterior", "[]", ""],
    ["Q50 Front Bumper", "Infiniti 0015", "Complete carbon fiber", 989, "Exterior", "[]", "4"],
    ["Automatic Transmission", "Infiniti 0016", "", 1129, "Engine", "[]", "01"],
    ["BC Racing", "Infiniti 0017", "", 459, "Suspension", "[]", "08"],
    ["Truck", "Infiniti 0018", "", 288, "Exterior", "[]", "02"],
    ["Front Lip", "Infiniti 0019", "Carbon Front lip", 149, "Exterior", "[]", "05"],
    ["Hood", "Infiniti 0020", "Brand New hood", 429, "Exterior", "[]", "02"],
    ["Carbon Fiber Hood", "Infiniti 0021", "", 499, "Exterior", "[]", ""],
    ["G37 Headlight", "Infiniti 0022", "After market customize G37 headlight", 398, "Headlights", "[]", "10"],
    ["G37 IPL Front Bumper", "Infiniti 00023", "Complete G37 front bumper", 499, "Exterior", "[]", ""],
    ["Cat Back", "Infiniti 00024", "Stainless steel Cat back", 1209, "Exhaust", "[]", "03"],
    ["Stock of bumpers", "Infiniti 00025", "Variety of front bumpers", 10, "Exterior", "[]", "stock"],
    ["Seats", "Infiniti 0026", "Complete set of seat", 1300, "Interior", "[]", "01"],
    ["Exhausts", "Infiniti 0028", "Complete Catback set", 499, "Exhaust", "[]", ""],
    ["Suspension air bag", "Infiniti 0029", "Complete set", 1300, "Suspension", "[]", "Limited"],
    ["Fenders", "Infiniti 0030", "", 758, "Exterior", "[]", ""],
    ["Hood", "Infiniti 0031", "", 429, "Exterior", "[]", "Very limited"],
    ["Spoiler", "Infiniti 00032", "Trunk spoiler", 124, "Exterior", "[]", "20"],
    ["Shift Paddle", "Infiniti 0033", "", 99, "Interior", "[]", "09"],
    ["Front lip", "Infiniti 0034", "", 129, "Exterior", "[]", "05"],
    ["Coilovers", "Infiniti 0035", "BC RACING fits on 2014-2022 Q50/Q60 with damper extension", 658, "Suspension", "[]", "Limited"],
    ["Door logo light", "Infiniti 00036", "Any design could be personalized", 120, "Lights", "[]", ""],
    ["Q50 Front Bumper", "Infiniti 0037", "Q50 Front Bumper", 499, "Exterior", "[]", "Limited"],
    ["Engine Cover", "Infiniti 0038", "", 99, "Engine", "[]", ""],
    ["Q50 Demon Headlight", "Infiniti 0039", "", 758, "Headlights", "[]", "Limited"],
    ["Cold Air Intake", "Infiniti 0040", "Contact support for various varieties", 230, "Engine", "[]", "03"]
  ].forEach(product => stmt.run(product));
  stmt.finalize();
});

module.exports = db;