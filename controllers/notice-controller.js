const Notice = require('../models/noticeSchema.js');

const noticeCreate = async (req, res) => {
    try {
        const notice = new Notice({
            ...req.body,
            school: req.body.adminID
        });
        const result = await notice.save();
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const noticeList = async (req, res) => {
    try {
        const notices = await Notice.find({ school: req.params.id });
        if (notices.length > 0) {
            return res.status(200).json(notices);
        }
        return res.status(404).json({ message: "No notices found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateNotice = async (req, res) => {
    try {
        const result = await Notice.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!result) {
            return res.status(404).json({ message: "Notice not found" });
        }
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const result = await Notice.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: "Notice not found" });
        }
        return res.status(200).json({ message: "Notice deleted successfully", result });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteNotices = async (req, res) => {
    try {
        const result = await Notice.deleteMany({ school: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No notices found to delete" });
        }
        return res.status(200).json({ message: "Notices deleted successfully", result });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { noticeCreate, noticeList, updateNotice, deleteNotice, deleteNotices };
