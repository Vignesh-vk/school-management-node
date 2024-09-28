const Sclass = require('../models/sclassSchema.js');
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');

const sclassCreate = async (req, res) => {
    try {
        const { sclassName, adminID } = req.body;

        const existingSclass = await Sclass.findOne({ sclassName, school: adminID });
        if (existingSclass) {
            return res.status(409).json({ message: 'Sorry, this class name already exists' });
        }

        const sclass = new Sclass({ sclassName, school: adminID });
        const result = await sclass.save();
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const sclassList = async (req, res) => {
    try {
        const sclasses = await Sclass.find({ school: req.params.id });
        if (sclasses.length > 0) {
            return res.status(200).json(sclasses);
        }
        return res.status(404).json({ message: "No classes found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getSclassDetail = async (req, res) => {
    try {
        const sclass = await Sclass.findById(req.params.id).populate("school", "schoolName");
        if (sclass) {
            return res.status(200).json(sclass);
        }
        return res.status(404).json({ message: "No class found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getSclassStudents = async (req, res) => {
    try {
        const students = await Student.find({ sclassName: req.params.id });
        if (students.length > 0) {
            const modifiedStudents = students.map(({ _doc }) => ({ ..._doc, password: undefined }));
            return res.status(200).json(modifiedStudents);
        }
        return res.status(404).json({ message: "No students found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteSclass = async (req, res) => {
    try {
        const deletedClass = await Sclass.findByIdAndDelete(req.params.id);
        if (!deletedClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        await Student.deleteMany({ sclassName: req.params.id });
        await Subject.deleteMany({ sclassName: req.params.id });
        await Teacher.deleteMany({ teachSclass: req.params.id });

        return res.status(200).json({ message: "Class deleted successfully", deletedClass });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteSclasses = async (req, res) => {
    try {
        const deletedClasses = await Sclass.deleteMany({ school: req.params.id });
        if (deletedClasses.deletedCount === 0) {
            return res.status(404).json({ message: "No classes found to delete" });
        }

        await Student.deleteMany({ school: req.params.id });
        await Subject.deleteMany({ school: req.params.id });
        await Teacher.deleteMany({ school: req.params.id });

        return res.status(200).json({ message: "Classes deleted successfully", deletedClasses });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { sclassCreate, sclassList, getSclassDetail, getSclassStudents, deleteSclass, deleteSclasses };
