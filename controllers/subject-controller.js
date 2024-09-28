const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');

const subjectCreate = async (req, res) => {
    try {
        const subjects = req.body.subjects.map(({ subName, subCode, sessions }) => ({
            subName,
            subCode,
            sessions,
            sclassName: req.body.sclassName,
            school: req.body.adminID,
        }));

        const existingSubject = await Subject.findOne({
            'subjects.subCode': subjects[0].subCode,
            school: req.body.adminID,
        });

        if (existingSubject) {
            return res.status(400).json({ message: 'Subcode must be unique; it already exists' });
        }

        const result = await Subject.insertMany(subjects);
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const allSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ school: req.params.id }).populate("sclassName", "sclassName");
        return res.status(200).json(subjects.length > 0 ? subjects : { message: "No subjects found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const classSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ sclassName: req.params.id });
        return res.status(200).json(subjects.length > 0 ? subjects : { message: "No subjects found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const freeSubjectList = async (req, res) => {
    try {
        const subjects = await Subject.find({ sclassName: req.params.id, teacher: { $exists: false } });
        return res.status(200).json(subjects.length > 0 ? subjects : { message: "No subjects found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getSubjectDetail = async (req, res) => {
    try {
        let subject = await Subject.findById(req.params.id).populate("sclassName", "sclassName").populate("teacher", "name");
        if (!subject) {
            return res.status(404).json({ message: "No subject found" });
        }
        return res.status(200).json(subject);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
        if (!deletedSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }

        await Teacher.updateMany(
            { teachSubject: deletedSubject._id },
            { $unset: { teachSubject: "" } }
        );

        await Student.updateMany(
            {},
            { $pull: { examResult: { subName: deletedSubject._id }, attendance: { subName: deletedSubject._id } } }
        );

        return res.status(200).json(deletedSubject);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteSubjects = async (req, res) => {
    try {
        const deletedSubjects = await Subject.deleteMany({ school: req.params.id });
        await Teacher.updateMany(
            { teachSubject: { $in: deletedSubjects.map(subject => subject._id) } },
            { $unset: { teachSubject: "" } }
        );
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        return res.status(200).json(deletedSubjects);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteSubjectsByClass = async (req, res) => {
    try {
        const deletedSubjects = await Subject.deleteMany({ sclassName: req.params.id });
        await Teacher.updateMany(
            { teachSubject: { $in: deletedSubjects.map(subject => subject._id) } },
            { $unset: { teachSubject: "" } }
        );
        await Student.updateMany(
            {},
            { $set: { examResult: null, attendance: null } }
        );

        return res.status(200).json(deletedSubjects);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    subjectCreate,
    freeSubjectList,
    classSubjects,
    getSubjectDetail,
    deleteSubjectsByClass,
    deleteSubjects,
    deleteSubject,
    allSubjects,
};
