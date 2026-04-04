const Records = require("../models/Records");
const Users = require("../models/Users");


exports.getProfile = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const user = await Users.findById(loggedinid).select('-password');
        if (!user) {
            return res.status(404).json({ message: "No user found with the login details." })
        }
        if(user.isActive === false){
            return res.status(403).json({ message: 'Your account is deactivated.' })
        }
        return res.status(200).json({ message: "Logged-in user Profile:", user });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

exports.getRecords = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        var records;
        const id = req.params.id;
        const loggedinuser = await Users.findById(loggedinid);
        if(loggedinuser.isActive === false){
            return res.status(403).json({ message: 'Your account is deactivated.' })
        }
        if (loggedinuser.role === "Viewer") {
            records = await Records.find({ userId: loggedinid });
        }
        else if (loggedinuser.role === "Analyst" || loggedinuser.role === "Admin") {
            if (id) {
                records = await Records.find({ userId: id }).populate('userId', '-password -createdAt -updatedAt');
            }
            else {
                records = await Records.find().populate('userId', '-password -createdAt -updatedAt');
            }
        }
        if (!records.length) {
            return res.status(404).json({ message: "No records found." })
        }
        return res.status(200).json({ message: "Records fetched successfully", records });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

exports.getRecordById = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }

        var record;
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Missing Record id." })
        }

        const loggedinuser = await Users.findById(loggedinid);
        if(loggedinuser.isActive === false){
            return res.status(403).json({ message: 'Your account is deactivated.' })
        }
        if (loggedinuser.role === "Viewer") {
            record = await Records.findOne({ userId: loggedinid, _id: id });
        }
        else if (loggedinuser.role === "Analyst" || loggedinuser.role === "Admin") {
            record = await Records.findById(id).populate('userId', '-password -createdAt -updatedAt');
        }
        if (!record) {
            return res.status(404).json({ message: "No record found." })
        }
        return res.status(200).json({ message: "Record fetched successfully", record });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

exports.filterRecords = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }
        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser) {
            return res.status(403).json({ message: "No user found with the login details." })
        }
        if(loggedinuser.isActive === false){
            return res.status(403).json({ message: 'Your account is deactivated.' })
        }

        const { date, category, type } = req.query;
        const filter = {};

        if (date) filter.dateOfTransaction = date;
        if (category) filter.category = category;
        if (type) filter.amountType = type;

        let records;
        if (loggedinuser.role === "Viewer") {
            records = await Records.find({ ...filter, userId: loggedinid });
        }
        else if (loggedinuser.role === "Analyst" || loggedinuser.role === "Admin") {
            records = await Records.find(filter).populate('userId', '-password -createdAt -updatedAt');
        }
        else {
            return res.status(403).json({ message: "Unauthorized role." })
        }

        if (!records.length) {
            return res.status(404).json({ message: "No records found matching the criteria." })
        }
        return res.status(200).json({ message: "Filtered records fetched successfully", records });
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}


const calculateSummary = (records) => {
    const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        categoryWiseTotals: {},
        monthlyTrends: {}
    };

    records.forEach(record => {
        const amount = record.amount;
        const category = record.category;
        const date = new Date(record.dateOfTransaction);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (record.amountType === 'Income') {
            summary.totalIncome += amount;
        } else if (record.amountType === 'Expense') {
            summary.totalExpenses += amount;
        }

        if (!summary.categoryWiseTotals[category]) {
            summary.categoryWiseTotals[category] = {
                income: 0,
                expense: 0,
                net: 0
            };
        }

        if (record.amountType === 'Income') {
            summary.categoryWiseTotals[category].income += amount;
        } else {
            summary.categoryWiseTotals[category].expense += amount;
        }
        summary.categoryWiseTotals[category].net = summary.categoryWiseTotals[category].income - summary.categoryWiseTotals[category].expense;


        if (!summary.monthlyTrends[monthKey]) {
            summary.monthlyTrends[monthKey] = {
                income: 0,
                expense: 0,
                net: 0
            };
        }
        if (record.amountType === 'Income') {
            summary.monthlyTrends[monthKey].income += amount;
        } else {
            summary.monthlyTrends[monthKey].expense += amount;
        }
        summary.monthlyTrends[monthKey].net = summary.monthlyTrends[monthKey].income - summary.monthlyTrends[monthKey].expense;
    });

    summary.netBalance = summary.totalIncome - summary.totalExpenses;
    return summary;
};


exports.getDashboardSummary = async (req, res) => {
    try {
        const loggedinid = req.user && req.user.id;
        if (!loggedinid) {
            return res.status(401).json({ message: 'Unauthorized, Please login and try again.' })
        }

        const loggedinuser = await Users.findById(loggedinid);
        if (!loggedinuser) {
            return res.status(403).json({ message: "No user found with the login details." })
        }

        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate) {
            dateFilter.dateOfTransaction = { $gte: new Date(startDate) };
        }
        if (endDate) {
            dateFilter.dateOfTransaction = dateFilter.dateOfTransaction || {};
            dateFilter.dateOfTransaction.$lte = new Date(endDate);
        }

        if (loggedinuser.role === "Viewer") {
            const records = await Records.find({ userId: loggedinid, ...dateFilter });
            const summary = calculateSummary(records);

            return res.status(200).json({
                message: "Dashboard summary fetched successfully",
                data: {
                    userRole: "Viewer",
                    summary: summary,
                    recordCount: records.length
                }
            });
        }
        else if (loggedinuser.role === "Analyst" || loggedinuser.role === "Admin") {
            const allRecords = await Records.find({ ...dateFilter }).populate('userId', 'name email mobileNumber');

            const overallSummary = calculateSummary(allRecords);

            const viewerSummaries = {};
            const recordsByViewer = {};

            allRecords.forEach(record => {
                const viewerId = record.userId._id.toString();
                if (!recordsByViewer[viewerId]) {
                    recordsByViewer[viewerId] = [];
                }
                recordsByViewer[viewerId].push(record);
            });

            for (const viewerId in recordsByViewer) {
                const viewerRecords = recordsByViewer[viewerId];
                const firstRecord = viewerRecords[0];
                viewerSummaries[viewerId] = {
                    viewerName: firstRecord.userId.name,
                    viewerEmail: firstRecord.userId.email,
                    viewerMobile: firstRecord.userId.mobileNumber,
                    summary: calculateSummary(viewerRecords),
                    recordCount: viewerRecords.length
                };
            }

            return res.status(200).json({
                message: "Dashboard summary fetched successfully",
                data: {
                    userRole: loggedinuser.role,
                    overallSummary: overallSummary,
                    viewerSummaries: viewerSummaries,
                    totalRecords: allRecords.length,
                    totalViewers: Object.keys(viewerSummaries).length
                }
            });
        }
        else {
            return res.status(403).json({ message: "Unauthorized role." })
        }
    }
    catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
}
