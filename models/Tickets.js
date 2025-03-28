module.exports = (sequelize, DataTypes) => {
    const Tickets = sequelize.define("Tickets", {
        ticket_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        ticket_incident_number: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ticket_summary: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ticket_status: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ticket_priority: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ticket_person: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Karyawans',
                key: 'karyawan_id'
            }
        },
        ticket_site: { // Note: there's a typo here "ticker" instead of "ticket" - kept as is
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ticket_date_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        ticket_date_end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        ticket_group: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        ticket_assignee: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'user_id'
            }
        },
        ticket_notes: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    });

    Tickets.associate = (models) => {
        Tickets.belongsTo(models.Karyawans, {
            foreignKey: 'ticket_person',
            as: 'ticketPerson'
        });
        
        Tickets.belongsTo(models.Users, {
            foreignKey: 'ticket_assignee',
            as: 'ticketAssignee'
        });
    };

    return Tickets;
};