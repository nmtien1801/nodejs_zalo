"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // n session có 1 account
      Session.belongsTo(models.Account, {
        foreignKey: "accountID",
      });
    }
  }
  Session.init(
    {
      accountID: DataTypes.INTEGER,
      access_Token: DataTypes.STRING,
      refresh_Token: DataTypes.STRING,
      ip_device: DataTypes.STRING,
      user_agent: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Session",
    }
  );
  return Session;
};
