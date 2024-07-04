// import { Schema, model } from 'mongoose';
// import { IUser } from '../constants/interface';

// const userSchema = new Schema<IUser>({
//   userName: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 40,
//   },
//   email: {
//     type: String,
//     required: true,
//     trim: true,
//     unique: true,
//   },
//   password: { type: String, required: true },
//   location: String,
//   dateOfBirth: Date,
//   social: {
//     facebook: String,
//     linkedin: String,
//     github: String,
//     twitter: String,
//   },
//   image: {
//     type: String,
//     default:
//       'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png',
//   },
//   backgroundImage: String,
// }, { timestamps: true });

// export default model<IUser>('user', userSchema);


import { Schema, model } from 'mongoose';
import { IUser } from '../constants/interface';

const userSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: { type: String, required: true },
  location: String,
  dateOfBirth: Date,
  social: {
    facebook: String,
    linkedin: String,
    github: String,
    twitter: String,
  },
  image: {
    type: String,
    default: 'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png',
  },
  backgroundImage: String,
}, { timestamps: true });

export default model<IUser>('User', userSchema);
