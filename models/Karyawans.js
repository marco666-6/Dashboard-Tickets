module.exports = (sequelize, DataTypes) => {
    const Karyawans = sequelize.define("Karyawans", {
        karyawan_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        karyawan_personnel_number: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true, // Added unique constraint
        },
        karyawan_group: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_fullname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_firstname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_lastname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_organizational: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_organizational_unit: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_manager: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_workschedule: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        karyawan_longid: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        // Add hooks configuration
        hooks: {
            beforeValidate: (karyawan, options) => {
                if (karyawan.karyawan_fullname) {
                    const nameParts = karyawan.karyawan_fullname.trim().split(' ');
                    karyawan.karyawan_firstname = nameParts[0] || '';
                    karyawan.karyawan_lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
                }
            }
        },
        // Optional: Add index for performance
        indexes: [
            {
                unique: true,
                fields: ['karyawan_personnel_number']
            }
        ]
    });

    // Additional hooks for individual create and update
    Karyawans.beforeCreate(async (karyawan) => {
        if (karyawan.karyawan_fullname) {
            const nameParts = karyawan.karyawan_fullname.trim().split(' ');
            karyawan.karyawan_firstname = nameParts[0] || '';
            karyawan.karyawan_lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        }
    });

    Karyawans.beforeUpdate(async (karyawan) => {
        if (karyawan.changed('karyawan_fullname')) {
            const nameParts = karyawan.karyawan_fullname.trim().split(' ');
            karyawan.karyawan_firstname = nameParts[0] || '';
            karyawan.karyawan_lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        }
    });

    // Association method
    Karyawans.associate = (models) => {
        Karyawans.hasMany(models.Tickets, {
            foreignKey: 'ticket_person',
            as: 'tickets'
        });
    };

    return Karyawans;
};