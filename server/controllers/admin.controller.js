const Records = require("../models/Records");
const Users = require("../models/Users");
const bcrypt = require('bcryptjs');

const ALLOWED_ROLES = ['Viewer', 'Analyst', 'Admin'];
const ALLOWED_AMOUNT_TYPES = ['Income', 'Expense'];
const ALLOWED_CATEGORIES = ['Salary', 'Bank Interest', 'Pension', 'Rent', 'Stocks', 'Government Benefits', 'Food', 'Entertainment', 'Transportation', 'Education', 'Insurance', 'Shopping', 'Travel', 'Medical', 'Subscriptions', 'Fuel', 'Internet', 'Other'];

exports.registerNewUser = async (req, res) => {
    try {
        const { name, email, password, mobileNumber, role } = req.body;
        if(!name || !email || !password || !mobileNumber || !role){
            return res.status(400).json({ message: 'All fields are required to register' });
        };

        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser || loggedinuser.role !== 'Admin') {
            return res.status(404).json({ message: "Only logged-in admin have access." })
        }

        const existingEmail = await Users.findOne({ email });
        const existingMN = await Users.findOne({ mobileNumber });
        if (existingEmail) {
            return res.status(400).json({ message: 'User already exists with the email' });
        }
        else if (existingMN) {
            return res.status(400).json({ message: 'User already exists with the mobile number' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^\d{10}$/;
        const passwordRegex = /^.{8,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        else if (!mobileRegex.test(mobileNumber)) {
            return res.status(400).json({ message: 'Please enter only 10 digit mobile number' });
        }
        else if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least 8 characters' });
        }
        else if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed values are: ${ALLOWED_ROLES.join(', ')}` });
        }
        // else if(!role){
        //     role = 'Viewer';
        // }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new Users({ name, email, password: hashedPassword, mobileNumber, role });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', error: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getallUsers = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser || loggedinuser.role !== 'Admin') {
            return res.status(404).json({ message: "Only logged-in admin have access." })
        }

        const viewers = (await Users.find({}, '-password')).filter(user => user.role === 'Viewer');
        const analysts = (await Users.find({}, '-password')).filter(user => user.role === 'Analyst');
        if(!viewers.length && !analysts.length){
            return res.status(404).json({ message: "No users found." })
        }
        return res.status(200).json({ message:"Users list fetched successfully", viewers, analysts });
    }
    catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message })
    }   
}

exports.getUserById = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser || loggedinuser.role !== 'Admin') {
            return res.status(404).json({ message: "Only logged-in admin have access." })
        }

        const userId = req.params.id; 
        const user = await Users.findById(userId, '-password');
        if(!user){
            return res.status(404).json({ message: "No user found." })
        }
        return res.status(200).json({ message:"User fetched successfully", user });
    }
    catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message })
    }   
}

exports.updateUserDetailsById = async(req,res)=>{
    try{
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if(!loggedinuser || loggedinuser.role !="Admin"){
            return res.status(403).json({message:"Only logged-in Admin have access."})
        }
        
        const {id} = req.params;
        const user = await Users.findById(id);
        if(!user){
            return res.status(404).json({message:"No user found with the provided id."})
        }
        const {name, email, mobileNumber, isActive} = req.body;
        if(!name && !email && !mobileNumber && isActive === undefined){
            return res.status(400).json({message:"At least one field (name, email, mobileNumber, isActive(True/False)) is required to update the user details."});
        }

        if(name) user.name = name;
        if(email) user.email = email;
        if(mobileNumber) user.mobileNumber = mobileNumber;
        if(isActive !== undefined) user.isActive = isActive;
        await user.save();
        return res.status(200).json({message:"User details updated successfully", user});
    }
    catch(err){
        return res.status(500).json({message:"Internal server error", error:err.message});
    }
}


const parseAndNormalizeDate = (value) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }
    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
};

const isFutureDate = (value) => {
    const parsedDate = parseAndNormalizeDate(value);
    if (!parsedDate) {
        return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsedDate > today;
};

const validateRecordFields = ({ amountType, category, dateOfTransaction }) => {
    if (amountType && !ALLOWED_AMOUNT_TYPES.includes(amountType)) {
        return `Invalid amountType. Allowed values are: ${ALLOWED_AMOUNT_TYPES.join(', ')}`;
    }

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
        return `Invalid category. Allowed values are: ${ALLOWED_CATEGORIES.join(', ')}`;
    }

    if (dateOfTransaction) {
        const dateCheck = isFutureDate(dateOfTransaction);
        if (dateCheck === null) {
            return 'Invalid Date of Transaction.';
        }
        if (dateCheck) {
            return 'Date of Transaction cannot be a future date.';
        }
    }
    return null;
};

exports.createRecord = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if(!loggedinuser || loggedinuser.role !="Admin"){
            return res.status(403).json({message:"Only logged-in Admin have access."})
        }
        var { email, amount, amountType, category, dateOfTransaction, description } = req.body;
        if (!email || !amount || !amountType || !category || !dateOfTransaction) {
            return res.status(400).json({ message: 'All fields are required to create a record' });
        }
        const createValidationMessage = validateRecordFields({ amountType, category, dateOfTransaction });
        if (createValidationMessage) {
            return res.status(400).json({ message: createValidationMessage });
        }
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with the provided email' });
        }

        if(!description){
            description = "A total of " + amount + " is added as " + amountType + " in the category of " + category + " on " + dateOfTransaction;
        }

        const record = new Records({
            userId: user._id, amount, amountType, category, dateOfTransaction, description
        });
        await record.save();
        return res.status(201).json({ message: 'Record created successfully', record });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', error: err.message });
        }
        return res.status(500).json({ message: 'Internal server error', error: err.message })
    }
}
 
exports.updateRecordById = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser || loggedinuser.role !== "Admin") {
            return res.status(403).json({ message: "Only logged-in Admin have access." })
        }

        const { id } = req.params;
        const record = await Records.findById(id);
        if (!record) {
            return res.status(404).json({ message: "No record found with the provided id." })
        }

        const { amount, amountType, category, dateOfTransaction, description } = req.body;
        if (!amount && !amountType && !category && !dateOfTransaction && !description) {
            return res.status(400).json({ message: "At least one field is required to update the record." });
        }

        const updateValidationMessage = validateRecordFields({ amountType, category, dateOfTransaction });
        if (updateValidationMessage) {
            return res.status(400).json({ message: updateValidationMessage });
        }

        if (amount) record.amount = amount;
        if (amountType) record.amountType = amountType;
        if (category) record.category = category;
        if (dateOfTransaction) record.dateOfTransaction = dateOfTransaction;
        if (description) record.description = description;
        await record.save();
        return res.status(200).json({ message: "Record updated successfully", record });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', error: err.message });
        }
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

exports.deleteRecordById = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser || loggedinuser.role !== "Admin") {
            return res.status(403).json({ message: "Only logged-in Admin have access." })
        }

        const { id } = req.params;
        const record = await Records.findByIdAndDelete(id);
        if (!record) {
            return res.status(404).json({ message: "No record found with the provided id." })
        }
        return res.status(200).json({ message: "Record deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}