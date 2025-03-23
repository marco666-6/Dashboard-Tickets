// ===============================
// Import Library
// ===============================
const express = require('express');
const engine = require('ejs-locals');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const dbs = require("./models");
const { Op } = require('sequelize');
const Swal = require('sweetalert2');
const expressLayouts = require('express-ejs-layouts');

// ===============================
// Konfigurasi Multer untuk Upload
// ===============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ===============================
// Inisialisasi Aplikasi
// ===============================
const app = express();
const port = 3000;

// ===============================
// Atur View Engine
// ===============================
app.engine('ejs', engine);
app.set('view cache', false);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout extractScripts', true);
app.set('layout', false); // Default layout file
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    express.static(path.join(__dirname, "node_modules/bootstrap/dist/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/jquery/dist/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/sweetalert2/dist/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/@fortawesome/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/select2/dist/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/datatables/media/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/apexcharts/dist/"))
);
app.use(
    express.static(path.join(__dirname, "node_modules/highcharts/"))
);

// ===============================
// Middleware
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'n1994PS_',
    resave: false,
    saveUninitialized: true
}));

// ===============================
// Koneksi ke Database MySQL
// ===============================
let db;
(async () => {
    try {
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'ticket_system'
        });
        console.log('Server Terhubung ke MySQL!');
    } catch (error) {
        console.error('Gagal terhubung ke MySQL:', error);
    }
})();

// ===============================
// Middleware untuk Autentikasi
// ===============================
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/'); // Jika tidak terautentikasi, arahkan ke halaman login
}

function checkRole(...role) {
    return (req, res, next) => {
        if (req.session.user && role.includes(req.session.user.user_role)) {
            return next(); 
        } else {
            req.flash('error', 'Anda tidak memiliki akses ke halaman ini.');
            return res.redirect('/'); 
        }
    };
}


// ===============================
// Konfigurasi Nodemailer
// ===============================
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: "vikraselpian@gmail.com",
        pass: "stbc deit eina amze",
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Koneksi gagal:', error);
    } else {
        console.log('Koneksi transporter berhasil!');
    }
});

// ===============================
// Route: Halaman Login, Proses Login & Sign-up
// ===============================
app.get('/', (req, res) => {
    res.render('auth/login', { error: null });
});

// ===============================
// Login Route
// ===============================
app.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;
    try {
        const user = await dbs.Users.findOne({
            where: {
                [Op.or]: [{ user_email: username }, { user_username: username }]
            }
        });
        
        console.log(user);

        if (!user || user == null) {
            return res.json({ error: 'Username or Email not found!' });
        } else {
            const match = await bcrypt.compare(password, user.user_password);
            if (!match) {
                return res.json({ error: 'Incorrect password!' });
            } else {
                req.session.user = user;

                if (rememberMe) {
                    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // Remember me for 1 day
                }

                console.log(req.session.user.user_role);

                // Success login - SweetAlert pop-up on front-end
                res.json({
                    successMessage: 'Login Successful! Redirecting...',
                    redirectUrl: '/user/home',
                    error: null
                });
            }
        }        
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Something went wrong. Please try again!', successMessage: null });
    }
});

// ===============================
// Sign-Up Route
// ===============================
app.post('/signup', async (req, res) => {
    const { user_firstname, user_lastname, user_name, user_username, user_email, user_phone, user_password, user_confpassword, user_shipaddress } = req.body;
    try {
        const existingUser = await dbs.Users.findOne({
            where: {
                [Op.or]: [{ user_email }, { user_username }]
            }
        });

        if (existingUser) {
            return res.render('auth/login', { error: 'Username or Email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(user_password, 10);
        const newUser = await dbs.Users.create({
            user_firstname,
            user_lastname,
            user_name,
            user_username,
            user_email,
            user_phone,
            user_password: hashedPassword,
            user_shipaddress,
        });

        // Sign-up success - SweetAlert pop-up on front-end
        res.json({
            successMessage: 'Sign-up Successful! You can now log in.',
            redirectUrl: '/user/home'
        });
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Something went wrong. Please try again!' });
    }
});





app.get('/user/home', isAuthenticated, checkRole('user'), async (req, res) => {
    try {
        res.render('user/home', { 
            user: req.session.user, 
            title: 'User Home', 
            layout: './shared/dash_layout' 
        });
    } catch (error) {
        console.error('Error saat mengambil data:', error);
        res.status(500).send('Gagal mengambil data');
    }
});

// ===============================
// Jalankan Server
// ===============================
dbs.sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});