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
        },
        karyawan_name: {
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
            unique: true,
        },
        karyawan_longid: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    });

    // // Hooks for hashing password and generating default user_name
    // Users.beforeCreate(async (user) => {
    //     if (!user.user_password) {
    //         user.user_password = await bcrypt.hash("123", 10);
    //     }
    //     if (!user.user_name) {
    //         user.user_name = `${user.user_firstname} ${user.user_lastname}`;
    //     }
    // });

    return Karyawans;
};