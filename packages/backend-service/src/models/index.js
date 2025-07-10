const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/school-management.db'),
});

// Define Class model
const Class = sequelize.define('Class', {
  uuid: {
    type: DataTypes.TEXT,
    primaryKey: true,
  },
  numeric_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  academic_year: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  number_of_students: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  number_of_sections: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Define Section model
const Section = sequelize.define('Section', {
  uuid: {
    type: DataTypes.TEXT,
    primaryKey: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  student_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  class_uuid: {
    type: DataTypes.TEXT,
    allowNull: false,
    references: {
      model: Class,
      key: 'uuid',
    },
  },
});

// Define Student model
const Student = sequelize.define('Student', {
  uuid: {
    type: DataTypes.TEXT,
    primaryKey: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  roll_number: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  section_uuid: {
    type: DataTypes.TEXT,
    allowNull: false,
    references: {
      model: Section,
      key: 'uuid',
    },
  },
});

// Sync models with database
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced successfully'))
  .catch((err) => console.error('Error syncing database:', err));

module.exports = { sequelize, Class, Section, Student };
