const bcrypt = require('bcrypt');
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');
const Notice = require('../models/noticeSchema.js');
const Complain = require('../models/complainSchema.js');

const adminRegister = async (req, res) => {
    try {
        const { email, schoolName, password, ...otherDetails } = req.body;

        const existingAdminByEmail = await Admin.findOne({ email });
        const existingSchool = await Admin.findOne({ schoolName });

        if (existingAdminByEmail) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        if (existingSchool) {
            return res.status(409).json({ message: 'School name already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const admin = new Admin({
            ...otherDetails,
            email,
            schoolName,
            password: hashedPass
        });

        const result = await admin.save();
        result.password = undefined; // Do not send password back
        return res.status(201).json(result);

    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const adminLogIn = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        admin.password = undefined; // Do not send password back
        return res.status(200).json(admin);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAdminDetail = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: "No admin found" });
        }
        admin.password = undefined; // Do not send password back
        return res.status(200).json(admin);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const result = await Admin.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: "Admin not found" });
        }

        await Sclass.deleteMany({ school: req.params.id });
        await Student.deleteMany({ school: req.params.id });
        await Teacher.deleteMany({ school: req.params.id });
        await Subject.deleteMany({ school: req.params.id });
        await Notice.deleteMany({ school: req.params.id });
        await Complain.deleteMany({ school: req.params.id });

        return res.status(200).json({ message: "Admin deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        const result = await Admin.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        if (!result) {
            return res.status(404).json({ message: "Admin not found" });
        }

        result.password = undefined; // Do not send password back
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { adminRegister, adminLogIn, getAdminDetail, deleteAdmin, updateAdmin };
