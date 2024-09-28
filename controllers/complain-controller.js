const Complain = require('../models/complainSchema.js');

const complainCreate = async (req, res) => {
    try {
        const complain = new Complain(req.body);
        const result = await complain.save();
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const complainList = async (req, res) => {
    try {
        const complains = await Complain.find({ school: req.params.id }).populate("user", "name");
        if (complains.length > 0) {
            return res.status(200).json(complains);
        }
        return res.status(404).json({ message: "No complaints found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { complainCreate, complainList };
