"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 1 account có n session
      Account.hasMany(models.Session, {
        foreignKey: "accountID",
      });
    }
  }
  Account.init(
    {
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      roleID: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Account",
    }
  );
  return Account;
};
