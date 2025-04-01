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
// Additional required libraries
const xlsx = require('xlsx');
const fs = require('fs');

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
                    redirectUrl: '/home',
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
            redirectUrl: '/home'
        });
    } catch (err) {
        console.error(err);
        res.render('auth/login', { error: 'Something went wrong. Please try again!' });
    }
});

app.get('/home', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        // Fetch dashboard statistics
        const totalTickets = await dbs.Tickets.count();
        const totalUsers = await dbs.Users.count();
        const totalEmployees = await dbs.Karyawans.count();
        
        // Ticket Status Distribution
        const statusDistribution = await dbs.Tickets.findAll({
            attributes: [
                'ticket_status', 
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            group: ['ticket_status'],
            raw: true
        });

        // Ticket Priority Distribution
        const priorityDistribution = await dbs.Tickets.findAll({
            attributes: [
                'ticket_priority', 
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            group: ['ticket_priority'],
            raw: true
        });

        // Organizational Distribution
        const organizationalDistribution = await dbs.Tickets.findAll({
            include: [{
                model: dbs.Karyawans,
                as: 'ticketPerson',
                attributes: ['karyawan_organizational']
            }],
            attributes: [
                [dbs.sequelize.col('ticketPerson.karyawan_organizational'), 'organizational'],
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            group: ['ticketPerson.karyawan_organizational'],
            raw: true
        });

        // Department Distribution
        const departmentDistribution = await dbs.Tickets.findAll({
            include: [{
                model: dbs.Karyawans,
                as: 'ticketPerson',
                attributes: ['karyawan_organizational']
            }],
            attributes: [
                [dbs.sequelize.col('ticketPerson.karyawan_organizational'), 'department'],
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            group: ['ticketPerson.karyawan_organizational'],
            raw: true
        });

        // Assignee Distribution
        const assigneeDistribution = await dbs.Tickets.findAll({
            include: [{
                model: dbs.Users,
                as: 'ticketAssignee',
                attributes: ['user_firstname', 'user_lastname']
            }],
            attributes: [
                [dbs.sequelize.literal("ticketAssignee.user_lastname"), 'assignee_name'],
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            where: {
                ticket_assignee: { [dbs.Sequelize.Op.ne]: null }
            },
            group: ['ticketAssignee.user_id'],
            raw: true
        });

        // Get Tickets by Month for the Area Chart
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Last 5 months

        const ticketsByMonth = await dbs.Tickets.findAll({
            attributes: [
                'ticket_priority',
                [dbs.sequelize.fn('MONTH', dbs.sequelize.col('ticket_date_start')), 'month'],
                [dbs.sequelize.fn('YEAR', dbs.sequelize.col('ticket_date_start')), 'year'],
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            where: {
                ticket_date_start: {
                    [dbs.Sequelize.Op.gte]: startDate
                }
            },
            group: ['ticket_priority', 
                   dbs.sequelize.fn('MONTH', dbs.sequelize.col('ticket_date_start')), 
                   dbs.sequelize.fn('YEAR', dbs.sequelize.col('ticket_date_start'))],
            order: [
                [dbs.sequelize.literal('year'), 'ASC'],
                [dbs.sequelize.literal('month'), 'ASC']
            ],
            raw: true
        });

        // Process the tickets by month data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const priorityMonthlyData = {};
        const monthLabels = [];
        
        // Initialize data structure
        ticketsByMonth.forEach(item => {
            const monthIdx = parseInt(item.month) - 1;
            const monthYear = `${months[monthIdx]} ${item.year}`;
            
            if (!monthLabels.includes(monthYear)) {
                monthLabels.push(monthYear);
            }
            
            if (!priorityMonthlyData[item.ticket_priority]) {
                priorityMonthlyData[item.ticket_priority] = {};
            }
            
            priorityMonthlyData[item.ticket_priority][monthYear] = parseInt(item.count);
        });
        
        // Create series data for area chart
        const priorityAreaChartSeries = Object.keys(priorityMonthlyData).map(priority => {
            const data = monthLabels.map(month => priorityMonthlyData[priority][month] || 0);
            return { name: priority, data };
        });

        // Get department status distribution
        const departmentStatusDistribution = await dbs.Tickets.findAll({
            include: [{
                model: dbs.Karyawans,
                as: 'ticketPerson',
                attributes: ['karyawan_organizational']
            }],
            attributes: [
                [dbs.sequelize.col('ticketPerson.karyawan_organizational'), 'department'],
                'ticket_status',
                [dbs.sequelize.fn('COUNT', dbs.sequelize.col('ticket_id')), 'count']
            ],
            group: ['ticketPerson.karyawan_organizational', 'ticket_status'],
            raw: true
        });

        // Process department status data for stacked chart
        const departments = [...new Set(departmentStatusDistribution.map(item => item.department))];
        const statuses = [...new Set(departmentStatusDistribution.map(item => item.ticket_status))];
        
        const statusSeriesData = {};
        statuses.forEach(status => {
            statusSeriesData[status] = departments.map(dept => {
                const match = departmentStatusDistribution.find(item => 
                    item.department === dept && item.ticket_status === status);
                return match ? parseInt(match.count) : 0;
            });
        });

        // Recent Tickets
        const recentTickets = await dbs.Tickets.findAll({
            order: [['ticket_date_start', 'DESC']],
            limit: 10,
            include: [
                { 
                    model: dbs.Karyawans, 
                    as: 'ticketPerson', 
                    attributes: ['karyawan_fullname'] 
                },
                { 
                    model: dbs.Users, 
                    as: 'ticketAssignee', 
                    attributes: ['user_firstname', 'user_lastname'] 
                }
            ],
            raw: true,
            nest: true
        });

        res.render('pages/home', { 
            user: req.session.user, 
            title: 'Dashboard', 
            currentPath: 'home', 
            layout: './shared/dash_layout',
            stats: {
                totalTickets,
                totalUsers,
                totalEmployees
            },
            statusDistribution,
            priorityDistribution,
            organizationalDistribution,
            departmentDistribution,
            assigneeDistribution,
            monthLabels,
            priorityAreaChartSeries,
            departments,
            statusSeriesData,
            recentTickets
        });
    } catch (error) {
        console.error('Error saat mengambil data:', error);
        res.status(500).send('Gagal mengambil data');
    }
});

// Route for initial page render
app.get('/worker', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        res.render('pages/worker', { 
            user: req.session.user, 
            title: 'Worker Management', 
            currentPath: 'worker', 
            layout: './shared/dash_layout' 
        });
    } catch (error) {
        console.error('Error rendering worker page:', error);
        res.status(500).send('Gagal memuat halaman');
    }
});

// New route for fetching employee data via AJAX
app.get('/api/workers', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        const employees = await dbs.Karyawans.findAll({
            order: [['createdAt', 'DESC']],
            attributes: [
                'karyawan_id', 
                'karyawan_personnel_number', 
                'karyawan_fullname', 
                'karyawan_group', 
                'karyawan_organizational', 
                'karyawan_organizational',
                'karyawan_manager'
            ]
        });

        // Generate HTML for table rows
        const tableHtml = employees.map((employee, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${employee.karyawan_personnel_number}</td>
                <td>${employee.karyawan_fullname}</td>
                <td>${employee.karyawan_group}</td>
                <td>${employee.karyawan_organizational}</td>
                <td>${employee.karyawan_organizational}</td>
                <td>${employee.karyawan_manager}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" onclick="editEmployee('${employee.karyawan_id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.karyawan_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        res.json({ html: tableHtml });
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// Route to generate template Excel file
app.get('/download-template-workers', (req, res) => {
    const templateData = [
        [
            'Personnel Number', 
            'Employee Group', 
            'Organizational', 
            'Organizational Unit', 
            'Name of Manager (OM)', 
            'Work Schedule Rule', 
            'Long ID/Number'
        ]
    ];

    const worksheet = xlsx.utils.aoa_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Employee Template');

    const templatePath = path.join(__dirname, 'public', 'templates', 'employee_template.xlsx');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(templatePath), { recursive: true });
    
    xlsx.writeFile(workbook, templatePath);
    
    res.download(templatePath, 'employee_template.xlsx');
});

// Route to handle Excel import
app.post('/import-workers', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        
        // Check if only one sheet exists
        if (workbook.SheetNames.length > 1) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ error: 'Excel file should contain only one sheet' });
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate header row
        const expectedHeaders = [
            'Pers.No.',
            'Personnel Number', 
            'Employee Group', 
            'Organizational', 
            'Organizational Unit', 
            'Name of Manager (OM)', 
            'Work Schedule Rule', 
            'Long ID/Number'
        ];

        const actualHeaders = jsonData[0];
        const headersMatch = expectedHeaders.every((header, index) => 
            header.toLowerCase().trim() === actualHeaders[index].toLowerCase().trim()
        );

        if (!headersMatch) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ 
                error: 'Invalid file format. Please use the downloaded template.' 
            });
        }

        // Remove header row and filter out empty rows
        const employeeData = jsonData
            .slice(1)
            .filter(row => row.some(cell => cell !== null && cell !== ''));

        // Bulk insert employees with explicit firstname and lastname extraction
        const importedEmployees = await dbs.Karyawans.bulkCreate(
            employeeData.map(row => {
                const fullName = row[1]; // Assuming full name is in the second column
                const nameParts = fullName.trim().split(' ');
                return {
                    karyawan_personnel_number: row[0],
                    karyawan_group: row[2],
                    karyawan_organizational: row[3],
                    karyawan_organizational: row[4],
                    karyawan_fullname: fullName,
                    karyawan_firstname: nameParts[0] || '',
                    karyawan_lastname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0],
                    karyawan_manager: row[5],
                    karyawan_workschedule: row[6],
                    karyawan_longid: row[7]
                };
            }),
            { 
                hooks: true,  // Explicitly enable hooks
                ignoreDuplicates: true  // Optional: skip duplicate entries
            }
        );

        // Delete temporary uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Successfully imported ${importedEmployees.length} employees`,
            count: importedEmployees.length
        });

    } catch (error) {
        console.error('Import error:', error);
        // Delete temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            error: 'An error occurred during import', 
            details: error.message 
        });
    }
});

// Route for initial page render
app.get('/ticket', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        res.render('pages/ticket', { 
            user: req.session.user, 
            title: 'Ticket Management', 
            currentPath: 'ticket', 
            layout: './shared/dash_layout' 
        });
    } catch (error) {
        console.error('Error rendering ticket page:', error);
        res.status(500).send('Gagal memuat halaman');
    }
});

// New route for fetching ticket data via AJAX
app.get('/api/ticket', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        const tickets = await dbs.Tickets.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { 
                    model: dbs.Karyawans, 
                    as: 'ticketPerson', 
                    attributes: ['karyawan_fullname'] 
                },
                { 
                    model: dbs.Users, 
                    as: 'ticketAssignee', 
                    attributes: ['user_firstname', 'user_lastname'] 
                }
            ],
            attributes: [
                'ticket_id', 
                'ticket_incident_number', 
                'ticket_summary', 
                'ticket_status', 
                'ticket_priority', 
                'ticket_site',
                'ticket_date_start',
                'ticket_date_end',
                'ticket_group',
                'ticket_notes'
            ]
        });

        // Generate HTML for table rows
        const tableHtml = tickets.map((ticket, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${ticket.ticket_incident_number}</td>
                <td>${ticket.ticket_summary}</td>
                <td>${ticket.ticket_status}</td>
                <td>${ticket.ticket_priority}</td>
                <td>${ticket.ticketPerson ? ticket.ticketPerson.karyawan_fullname : '-'}</td>
                <td>${ticket.ticket_site}</td>
                <td>${new Date(ticket.ticket_date_start).toLocaleDateString()}</td>
                <td>${ticket.ticketAssignee ? `${ticket.ticketAssignee.user_firstname} ${ticket.ticketAssignee.user_lastname}` : '-'}</td>
                <td>${new Date(ticket.ticket_date_end).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" onclick="editTicket('${ticket.ticket_id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTicket('${ticket.ticket_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        res.json({ html: tableHtml });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// Route to generate template Excel file
app.get('/download-template-ticket', (req, res) => {
    const templateData = [
        [
            'Incident Number', 
            'Summary', 
            'Status', 
            'Priority', 
            'Person', 
            'Site', 
            'Reported Date', 
            'Assigned Group', 
            'Assignee', 
            'End Date', 
            'Notes'
        ]
    ];

    const worksheet = xlsx.utils.aoa_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Ticket Template');

    const templatePath = path.join(__dirname, 'public', 'templates', 'ticket_template.xlsx');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(templatePath), { recursive: true });
    
    xlsx.writeFile(workbook, templatePath);
    
    res.download(templatePath, 'ticket_template.xlsx');
});

// Route to handle Excel import
app.post('/import-tickets', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        
        // Check if only one sheet exists
        if (workbook.SheetNames.length > 1) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ error: 'Excel file should contain only one sheet' });
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate header row
        const expectedHeaders = [
            'Incident Number', 
            'Summary', 
            'Status', 
            'Priority', 
            'Person', 
            'Site', 
            'Reported Date', 
            'Assigned Group', 
            'Assignee', 
            'End Date', 
            'Notes'
        ];

        const actualHeaders = jsonData[0];
        const headersMatch = expectedHeaders.every((header, index) => 
            header.toLowerCase().trim() === actualHeaders[index].toLowerCase().trim()
        );

        if (!headersMatch) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ 
                error: 'Invalid file format. Please use the downloaded template.' 
            });
        }

        // Remove header row and filter out empty rows
        const ticketData = jsonData
            .slice(1)
            .filter(row => row.some(cell => cell !== null && cell !== ''));

        // Bulk insert tickets
        const importedTickets = await dbs.Tickets.bulkCreate(
            await Promise.all(ticketData.map(async (row) => {
                // Find person by name
                const person = await dbs.Karyawans.findOne({
                    where: { karyawan_fullname: row[4] }
                });

                // Find assignee by name
                const assignee = await dbs.Users.findOne({
                    where: { 
                        [dbs.Sequelize.Op.or]: [
                            dbs.Sequelize.literal(`CONCAT(user_firstname, ' ', user_lastname) = '${row[8]}'`)
                        ]
                    }
                });

                return {
                    ticket_incident_number: row[0],
                    ticket_summary: row[1],
                    ticket_status: row[2],
                    ticket_priority: row[3],
                    ticket_person: person ? person.karyawan_id : null,
                    ticket_site: row[5],
                    ticket_date_start: new Date(row[6]),
                    ticket_group: row[7],
                    ticket_assignee: assignee ? assignee.user_id : null,
                    ticket_date_end: new Date(row[9]),
                    ticket_notes: row[10] || null
                };
            })),
            { 
                hooks: true,
                ignoreDuplicates: true  // Optional: skip duplicate entries
            }
        );

        // Delete temporary uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Successfully imported ${importedTickets.length} tickets`,
            count: importedTickets.length
        });

    } catch (error) {
        console.error('Import error:', error);
        // Delete temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            error: 'An error occurred during import', 
            details: error.message 
        });
    }
});

// Route for initial page render
app.get('/user', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        res.render('pages/user', { 
            user: req.session.user, 
            title: 'User Management', 
            currentPath: 'user', 
            layout: './shared/dash_layout' 
        });
    } catch (error) {
        console.error('Error rendering worker page:', error);
        res.status(500).send('Gagal memuat halaman');
    }
});

// New route for fetching employee data via AJAX
app.get('/api/users', isAuthenticated, checkRole('user', 'admin'), async (req, res) => {
    try {
        const users = await dbs.Users.findAll({
            order: [['createdAt', 'DESC']],
            attributes: [
                'user_id', 
                'user_firstname', 
                'user_lastname', 
                'user_username', 
                'user_password', 
                'user_email',
                'user_phone',
                'user_role'
            ]
        });

        // Generate HTML for table rows
        const tableHtml = users.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.user_username}</td>
                <td>${user.user_firstname} ${user.user_lastname}</td>
                <td>${user.user_email}</td>
                <td>${user.user_phone}</td>
                <td>${user.user_role}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" onclick="editUser('${user.user_id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.user_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        res.json({ html: tableHtml });
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// Route to generate template Excel file
app.get('/download-template-users', (req, res) => {
    const templateData = [
        [
            'First Name', 
            'Last Name', 
            'Username', 
            'Email', 
            'Phone'
        ]
    ];

    const worksheet = xlsx.utils.aoa_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'User Template');

    const templatePath = path.join(__dirname, 'public', 'templates', 'user_template.xlsx');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(templatePath), { recursive: true });
    
    xlsx.writeFile(workbook, templatePath);
    
    res.download(templatePath, 'user_template.xlsx');
});

// Route to handle Excel import
app.post('/import-users', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const workbook = xlsx.readFile(req.file.path);
        
        // Check if only one sheet exists
        if (workbook.SheetNames.length > 1) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({ error: 'Excel file should contain only one sheet' });
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Validate header row
        const expectedHeaders = [
            'First Name', 
            'Last Name', 
            'Username', 
            'Email', 
            'Phone'
        ];
        
        const actualHeaders = jsonData[0];
        const headersMatch = expectedHeaders.every((header, index) => 
            header.toLowerCase().trim() === actualHeaders[index].toLowerCase().trim()
        );
        
        if (!headersMatch) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
            return res.status(400).json({
                error: 'Invalid file format. Please use the downloaded template.'
            });
        }
        
        // Remove header row and filter out empty rows
        const userData = jsonData
            .slice(1)
            .filter(row => row.some(cell => cell !== null && cell !== ''));
        
        // Bulk insert employees with synchronized password hashing
        const importedUsers = await Promise.all(
            userData.map(async (row) => {
                const hashedPassword = await bcrypt.hash('123', 10);
                return {
                    user_firstname: row[0],
                    user_lastname: row[1],
                    user_username: row[2],
                    user_password: hashedPassword,
                    user_email: row[3],
                    user_phone: row[4]
                };
            })
        );
        
        // Perform bulk create with the pre-hashed passwords
        const createdUsers = await dbs.Users.bulkCreate(importedUsers, {
            ignoreDuplicates: true  // Optional: skip duplicate entries
        });
        
        // Delete temporary uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
            message: `Successfully imported ${createdUsers.length} users`,
            count: createdUsers.length
        });
    } catch (error) {
        console.error('Import error:', error);
        // Delete temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            error: 'An error occurred during import',
            details: error.message
        });
    }
});

// ===============================
// Logout Route
// ===============================
app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        // Redirect to login page
        res.redirect('/');
    });
});

// ===============================
// Jalankan Server
// ===============================
dbs.sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});