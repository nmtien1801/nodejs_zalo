//search: sequelize
"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Session", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      accountID: {
        type: Sequelize.INTEGER,
      },
      access_Token: {
        type: Sequelize.STRING,
      },
      refresh_Token: {
        type: Sequelize.STRING,
      },
      ip_device: {
        type: Sequelize.STRING,
      },
      user_agent: {
        type: Sequelize.STRING,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Session");
  },
};

// search : sequelize run specific migration
// npx sequelize-cli db:migrate --to session.js
// npx sequelize-cli db:migrate --to migrate_addColumnUser.js
