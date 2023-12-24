import bcrypt from 'bcryptjs';
// hash password
import dotenv from 'dotenv';
import Jimp from 'jimp';
// images
import { nanoid } from 'nanoid';

import User from '../models/users.js';
import jwt from 'jsonwebtoken';

import fs from 'fs/promises';
import path from 'path';

import generateAvatarUrl from '../utils/helpers/gravatar.js';

import HttpError from '../utils/helpers/httpErrors.js';

import ctrlWrapper from '../utils/decorators/ctrlWrapper.js';

dotenv.config();

const { JWT_SECRET } = process.env;

const avatarsPath = path.resolve('../','public', 'avatars');

const signup = async (req, res) => {
	const { email, password, name } = req.body;

	const user = await User.findOne({ email });
	if (user) {
		throw new HttpError(409, 'Email in use');
	}

	const hashPassword = await bcrypt.hash(password, 10);
	const verificationToken = nanoid();

	const avatar = generateAvatarUrl(email, {
		defaultImage: 'monsterid',
	});

	const newUser = await User.create({
		...req.body,
		name:name,
		email: email,
		
		password: hashPassword,
		verificationToken,
		avatarUrl: avatar,
	});

	res.status(201).json({
		email: newUser.email,
		subscription: newUser.subscription,
	});
};

const verify = async (req, res) => {
	const { verificationToken } = req.params;

	const user = await User.findOne({ verificationToken });
	if (!user) {
		throw new HttpError(404, 'User not found');
	}

	await User.updateOne({ verificationToken }, { verified: true, verificationToken: null });

	res.json({ message: 'Verification successful' });
};

const signin = async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		throw new HttpError(401, 'email or password is wrong');
	}

	// if (!user.verify) {
	// 	throw new HttpError(401, 'email not verify');
	// }

	const passwordCompare = await bcrypt.compare(password, user.password);
	if (!passwordCompare) {
		throw new HttpError(401, 'email or password is wrong');
	}

	const payload = {
		contactId: user._id,
	};

	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '23h' });
	await User.findByIdAndUpdate(user._id, { token });

	res.json({
		token,
		user: {
			email,
		},
	});
};

const getCurrent = async (req, res) => {
	const { email } = req.user;
	res.json({
		email,
	});
};

const updateUserInfo = async (req, res) => {
	const { name, email, gender, oldPassword, newPassword, confirmPassword} = req.body;
    const userId = req.user._id;

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

	if (newPassword){
		const isPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);
		if (!isPasswordValid) {
			throw new HttpError(401, 'Invalid old password');
		}

		if (newPassword !== confirmPassword) {
			throw new HttpError(400,'New password and confirmation do not match');
		}
		const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        existingUser.password = hashedNewPassword;
	}

    if (name) {existingUser.name = name};
    if (email) {existingUser.email = email};
    if (gender) {existingUser.gender = gender};

    const updatedUser = await existingUser.save();

    res.json(updatedUser);

};

const updateAvatar = async (req, res) => {
	const { _id } = req.user;

	const { path: oldPath, filename } = req.file;

	const newPath = path.join(avatarsPath, filename);

	(await Jimp.read(oldPath)).resize(250, 250).write(oldPath);

	await fs.rename(oldPath, newPath);
	const avatarUrl = path.join('avatars', filename);

	await User.findByIdAndUpdate(_id, { avatarUrl }, { new: true });
	if (error) {
		throw new HttpError(401, `Not authorized`);
	}
	res.status(200).json({ avatarUrl });
};

const signout = async (req, res) => {
	const { _id } = req.user;
	const result = await User.findByIdAndUpdate(_id, { token: '' });
  
    if (!result) {
      throw new HttpError(404, 'Not found');
    }

	res.json({
		message: 'Signout success',
	});
};

export default {
	signup: ctrlWrapper(signup),
	verify: ctrlWrapper(verify),
	signin: ctrlWrapper(signin),
	getCurrent: ctrlWrapper(getCurrent),
	updateUserInfo: ctrlWrapper(updateUserInfo),
	updateAvatar: ctrlWrapper(updateAvatar),
	signout: ctrlWrapper(signout),
};
