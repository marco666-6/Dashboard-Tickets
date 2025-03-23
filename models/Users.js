const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define("Users", {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        user_firstname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        user_lastname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        user_username: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        user_password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        user_email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        user_phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        user_role: {
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user",
        },
        user_resetpassword: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    });

    // Hooks for hashing password and generating default user_name
    Users.beforeCreate(async (user) => {
        if (!user.user_password) {
            user.user_password = await bcrypt.hash("123", 10);
        }
        if (!user.user_name) {
            user.user_name = `${user.user_firstname} ${user.user_lastname}`;
        }
    });

    return Users;
};