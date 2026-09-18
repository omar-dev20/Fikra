import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize';

export interface UserAttributes {
  id: string;
  email: string;
  theme?: 'light' | 'dark';
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare theme: 'light' | 'dark';
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark'),
      defaultValue: 'light',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;