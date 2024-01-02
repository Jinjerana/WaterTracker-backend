import Water from '../models/water.js';
import {
	handleMongooseError,
	preUpdate,
} from '../utils/helpers/handleMongooseError.js';

import ctrlWrapper from '../utils/decorators/ctrlWrapper.js';

const createWaterNote = async (req, res) => {
		const { date, waterVolume } = req.body;
		const owner = req.user._id;

		const newWaterNote = await Water.create({ 
			...req.body,
			date:date, 
			waterVolume:waterVolume, 
			owner:owner
		 });

		res.status(201).json(newWaterNote);
};

const updateWaterNote = async (req, res) => {
	try {
		const { date, waterVolume } = req.body;
		const ownerId = req.user._id;

		const updatedWaterNote = await Water.findOneAndUpdate(
			{ _id: req.params.id, owner: ownerId },
			{ date, waterVolume },
			{ new: true }
		);

		if (!updatedWaterNote) {
			return res.status(404).json({ message: 'Water note not found' });
		}

		res.json(updatedWaterNote);
	} catch (error) {
		handleMongooseError(error, res);
	}
};

const deleteWaterNote = async (req, res) => {
	try {
		const ownerId = req.user._id;

		const deletedWaterNote = await Water.findOneAndDelete({
			_id: req.params.id,
			owner: ownerId,
		});

		if (!deletedWaterNote) {
			return res.status(404).json({ message: 'Water note not found' });
		}

		res.json(deletedWaterNote);
	} catch (error) {
		handleMongooseError(error, res);
	}
};

export default {
	createWaterNote: ctrlWrapper(createWaterNote),
	updateWaterNote: ctrlWrapper(updateWaterNote),
	deleteWaterNote: ctrlWrapper(deleteWaterNote),
};
