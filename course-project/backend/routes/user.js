const express = require("express");
const router = express.Router();
const {v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticate");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bcrypt = require('bcrypt');

router.use(authenticateToken);

require('dotenv').config();


////////////////////////////////////////////////////////////////////////// USER ENDPOINTS
///////////////////////////////// /USERS
router.post("/", async (req, res) => {
    try{
        const { utorid, name, email } = req.body;

        // check if the user has proper clearance (must be cashier or higher)
        if (!["manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // check validity of the payload
        if(!utorid || !name || !email){
            return res.status(400).json({"error": "Missing fields"})
        }
        if(typeof utorid !== "string" || typeof name !== "string" || typeof email !== "string"){
            return res.status(400).json({"error": "Incorrect type for fields"})
        }
        if(utorid.length < 7 || utorid.length > 8){
            return res.status(400).json({"error": "utorid length is out of range (7-8)"})
        }
        if(name.length < 1 || name.length > 50){
            return res.status(400).json({"error": "Name length is out of range (1-50)"})
        }
        if(!email.endsWith("@mail.utoronto.ca")){
            return res.status(400).json({"error": "Invalid UofT email"})
        }

        // check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                utorid: utorid,
            },
        });

        if(existingUser) {
            return res.status(409).json({"error": "User with that utorid already exists"})
        }

        // create the user
        const newUser = await prisma.user.create({
            data: {
                utorid: utorid,
                name: name,
                email: email,
                role: 'regular',
                verified: false,
                activated: false,
            },
        })

        // create a new reset token
        const newResetToken = await prisma.resetToken.create({
            data: {
                utorid: utorid,
                token: uuidv4(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires 7 days from now
            }
        })

        const responseData = {
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: newResetToken.expiresAt,
            resetToken: newResetToken.token
        }

        return res.status(201).json(responseData)
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

router.get("/", async(req, res) => {
    try{
        const {
            name: nameFilter,
            role: roleFilter,
            verified: verifiedRaw,
            activated: activatedRaw,
            page: pageRaw = '1',
            limit: limitRaw = '10',
            sortBy: sortByRaw,
            sortOrder: sortOrderRaw,
        } = req.query;

        // check if user has proper clearance (manager or higher)
        if(!['manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({"error": "Not authorized"})
        }

        // parse and validate page/limit
        const page = Number(pageRaw);
        const limit = Number(limitRaw);
        if (!Number.isInteger(page) || page < 1) return res.status(400).json({ error: 'Invalid page' });
        if (!Number.isInteger(limit) || limit < 1) return res.status(400).json({ error: 'Invalid limit' });

        // parse and validate verified/activated (accept only 'true' or 'false' when provided)
        let verified;
        if (verifiedRaw !== undefined) {
            const v = String(verifiedRaw).toLowerCase();
            if (v === 'true') verified = true;
            else if (v === 'false') verified = false;
            else return res.status(400).json({ error: 'Incorrect type for fields' });
        }
        let activated;
        if (activatedRaw !== undefined) {
            const a = String(activatedRaw).toLowerCase();
            if (a === 'true') activated = true;
            else if (a === 'false') activated = false;
            else return res.status(400).json({ error: 'Incorrect type for fields' });
        }

        // extract filter data
        const where = {};
        if (nameFilter) where.name = nameFilter;
        if (roleFilter) where.role = roleFilter;
        if (verified !== undefined) where.verified = verified;
        if (activated !== undefined) where.activated = activated;

        const pageNum = page;
        const take = limit;
        const skip = (pageNum - 1) * take;

        // apply filter to find users
        //find the total count BEFORE pagination
        const count = await prisma.user.count({
            where,
        });

        //apply filter with pagination
        const allowedSorts = ['id','utorid','name','birthday','role','points','createdAt','lastLogin'];
        let orderBy = { id: 'asc' }; // default
        if (sortByRaw && allowedSorts.includes(String(sortByRaw))) {
            const dir = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'desc' : 'asc';
            orderBy = { [String(sortByRaw)]: dir };
        }

        const users = await prisma.user.findMany({
            skip: skip,
            take: take,
            where,
            select: {
                id: true,
                utorid: true,
                name: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
            orderBy,
        });

        return res.status(200).json({
            count,
            results: users,
        });
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

/////////////////////////////// /USERS/ME
router.patch("/me", upload.single("avatarUrl"), async (req, res) => {
    try{
        
        const { name, email, birthday} = req.body;

        // check if the user has proper clearance (must be regular or higher)
        if (!["regular", "cashier", "manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // check validity of the payload
        if(!name && !email && !birthday && !req.file){
            return res.status(400).json({"error": "No changes to make"})
        }
        if((name && typeof name !== "string") || (email && typeof email !== "string") || (birthday && typeof birthday !== "string")){
            return res.status(400).json({"error": "Incorrect type for fields"})
        }
        if(name && (name.length < 1 || name.length > 50)){
            return res.status(400).json({"error": "Name length is out of range (1-50 characters)"})
        }
        if(email && !email.endsWith("@mail.utoronto.ca")){
            return res.status(400).json({"error": "Invalid UofT email"})
        }
        if(req.file && !req.file.mimetype.startsWith("image/")){
            return res.status(400).json({"error": "Avatar file is not an image"})
        }

        // check if email is unique
        const uniqueEmail = await isEmailUnique(email, req.user.utorid)
        if(email && !uniqueEmail){
            return res.status(400).json({"error": "Email already exists"})
        }

        // check format of birthday and that it is a valid date
        const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (birthday) {
            // check format (YYYY-MM-DD)
            if (!birthdayRegex.test(birthday)) {
                return res.status(400).json({ error: "Invalid birthday format" });
            }

            // parse each part
            const [year, month, day] = birthday.split("-").map(Number);
            const dateObj = new Date(year, month - 1, day);

            // check if date is valid (e.g. feb 30 is invalid)
            if (
                dateObj.getFullYear() !== year ||
                dateObj.getMonth() !== month - 1 ||
                dateObj.getDate() !== day
            ) {
                return res.status(400).json({ error: "Invalid birthday" });
            }

            // check if birthday is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateObj > today) {
                return res.status(400).json({ error: "Invalid birthday date" });
            }
        }


        // create the updated json body
        const data = {};
        if(name) data.name = name;
        if(email) data.email = email;
        if(birthday) data.birthday = birthday;
        if(req.file) data.avatarUrl = `/uploads/avatars/${req.file.originalname}`;
        const updatedUser = await prisma.user.update({
            where: {
                utorid: req.user.utorid,
            },
            data,
        });

        return res.status(200).json(updatedUser);
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

router.get("/me", async (req, res) => {
    try {
        // check if the user has proper clearance (must be regular or higher)
        if (!["regular", "cashier", "manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const user = await prisma.user.findUnique({
            where: {
                utorid: req.user.utorid,
            },
        });

        // find promotions used by user
        const promotions = await prisma.promotion.findMany({
            where: {
                startTime: {lte: new Date()}, // check the start/end times of the promotion
                endTime: { gte: new Date()},
                transactions: {
                    some: {
                        utorid: req.user.utorid,
                    },
                },
            },
        })

        const responseData = {
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: promotions
        };

        return res.status(200).json(responseData);
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

/////////////////////////////// /USERS/ME/QR
router.get('/me/qr', async (req, res) => {
    try {
        if (!['regular','cashier','manager','superuser'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const user = await prisma.user.findUnique({ where: { utorid: req.user.utorid } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        let token = user.qrToken;
        if (!token) {
            token = uuidv4();
            await prisma.user.update({ where: { utorid: req.user.utorid }, data: { qrToken: token } });
        }
        return res.status(200).json({ qrToken: token });
    } catch (err) {
        console.error('Error /users/me/qr:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/////////////////////////////// /USERS/ME/PASSWORD
router.patch("/me/password", async (req, res) =>{

    try{
        const { old, new: newPassword } = req.body;
        console.log(req.body)
        console.log(typeof(old))
        console.log(typeof(newPassword))
        // check if the user has proper clearance (must be cashier or higher)
        if (!["regular", "cashier", "manager", "superuser"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // check validity of payload
        if(!old || !newPassword){
            return res.status(400).json({ error: "Missing password field(s)" });
        }
        if(typeof old !== "string" || typeof newPassword !== "string"){
            return res.status(400).json({ error: "Incorrect type for fields" });
        }

        //check if current password is correct
        const user = await prisma.user.findUnique({
            select: {
                password: true,
            },
            where: {
                utorid: req.user.utorid,
            },
        });

        // check if current password is correct
        const match = await bcrypt.compare(old, user.password);
        if(!match){
            return res.status(403).json({ error: "Current password is incorrect" });
        }

        // check if new password is valid
        if(old === newPassword){
            return res.status(400).json({ error: "New password cannot be current password" });
        }

        let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,20}$/;
        if(!regex.test(newPassword)){
            return res.status(400).json({ error: "New password must be 8-20 characters, have at least one uppercase, one lowercase, one number, and one special character"})
        }

        //update the password
        const cost = 10;
        var hashed = await bcrypt.hash(newPassword, cost);
        const updatedPassword = await prisma.user.update({
            where: {
                utorid: req.user.utorid,
            },
            data: {
                password: hashed,
            },
        });

        return res.status(200).json({message: "Password successfully updated"})
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

router.post("/me/transactions", async (req, res) => {
    try {
        // check if user has clearance (regular or higher)
        if(!['regular', 'cashier', 'manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({"error": "Not authorized"})
        }

        const { type, amount, remark } = req.body;

        // check validity of payload
        if(!type || typeof type !== "string" || type !== "redemption" || !amount || typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0 || (remark && typeof remark !== "string")){
            return res.status(400).json({error: "Missing or incorrect field types"})
        }

        // check if requested amount exceeds the user's point balance
        const user = await prisma.user.findUnique({
            where: {
                utorid: req.user.utorid
            }
        });

        if(user.points < amount){
            return res.status(400).json({error: "Requested amount to redeem exceeds user's point balance"})
        }

        // check if logged in user is verified
        if(!user.verified){
            return res.status(403).json({error: "User is not verified"})
        }

        // create the transaction
        const transaction = await prisma.transaction.create({
            data:{
                utorid: user.utorid,
                type: type,
                remark: remark || "",
                amount: amount,
                createdBy: user.utorid,
                processedBy: null,
                processed: false
            }
        })

        return res.status(201).json({
            id: transaction.id,
            utorid: transaction.utorid,
            type: transaction.type,
            processedBy: transaction.processedBy,
            amount: transaction.amount,
            remark: transaction.remark,
            createdBy: transaction.createdBy
        })

    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }

})

router.get("/me/transactions", async (req, res) => {
    try {
        // check if user has clearance (regular or higher)
        if(!['regular', 'cashier', 'manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({error: "Not authorized"})
        }
        
        // typecasted field values
        let relatedIdNum;
        let promotionIdNum;
        let amountNum;
        let pageNum = 1;
        let limitNum = 10;

        const allowedTypes = ['purchase', 'redemption', 'adjustment', 'event', 'transfer'];

        const {type, relatedId, promotionId, amount, operator, page, limit} = req.query;
        
        // check validity of payload
        if(type && !allowedTypes.includes(type)){
            return res.status(400).json({error: "Invalid type"})
        }

        // type & relatedId
        if(type || relatedId){
            if(!type || relatedId){
                return res.status(400).json({ error: "Type and relatedId must be provided together" });
            }

            if(relatedId){
                relatedIdNum = Number(relatedId);
                if (!Number.isInteger(relatedIdNum) || relatedIdNum < 1) {
                    return res.status(400).json({ error: "Invalid relatedId" });
                }
            }
        }

        // promotionId
        if(promotionId){
            promotionIdNum = Number(promotionId)
            if (!Number.isInteger(promotionIdNum) || promotionIdNum < 1) {
                return res.status(400).json({ error: "Invalid promotionId" });
            }
        }

        // amount
        if (amount || operator) {
            if (!amount || !operator) {
                return res.status(400).json({ error: "Amount and operator must be provided together" });
            }
            amountNum = Number(amount);
            if (isNaN(amountNum)) return res.status(400).json({ error: "Invalid amount" });
            if (!['gte', 'lte'].includes(operator)) {
                return res.status(400).json({ error: "Invalid operator" });
            }
        }

        // pagination
        if (page) {
            pageNum = Number(page);
            if (!Number.isInteger(pageNum) || pageNum < 1) {
                return res.status(400).json({ error: "Invalid page" });
            }
        }

        if (limit) {
            limitNum = Number(limit);
            if (!Number.isInteger(limitNum) || limitNum < 1) {
                return res.status(400).json({ error: "Invalid limit" });
            }
        }

        // built filters
        const where = {};
        if (promotionIdNum !== undefined) where.promotions = { some: { id: promotionIdNum } };
        if (type) where.type = type;
        if (relatedIdNum !== undefined) where.relatedId = relatedIdNum;
        if (amountNum !== undefined) where.amount = { [operator]: amountNum };

        // query database
        const count = await prisma.transaction.count({ where });
        const skip = (pageNum - 1) * limitNum;

        const transactions = await prisma.transaction.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { id: 'desc' },
            include: { promotions: { select: { id: true } } },
        });

        // format response
        const results = transactions.map(t => ({
            id: t.id,
            type: t.type,
            spent: t.spent ?? undefined,
            relatedId: t.relatedId ?? undefined,
            amount: t.amount,
            promotionIds: t.promotions.map(p => p.id),
            remark: t.remark || "",
            createdBy: t.createdBy
        }));

        return res.status(200).json({ count, results });
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

/////////////////////////////// /USERS/:USERID
router.get("/:userId", async (req, res) => {
    try{
        const userId = Number(req.params.userId);
        
        // check if user has clearance (cashier or higher)
        if(!['cashier', 'manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({error: "Not authorized"})
        }

        // check if userId is valid
        if(userId < 0 || !Number.isInteger(userId)){
            return res.status(400).json({error: "Invalid userId"})
        }
        
        // get user data
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        })

        // check if user exists
        if(!user){
            return res.status(404).json({error: "User Not found"})
        }

        // find promotions available to the user
        const availablePromotions = await prisma.promotion.findMany({
            where: {
                type: "onetime", // promotion must be one-time
                startTime: {lte: new Date()}, // check the start/end times of the promotion
                endTime: { gte: new Date()},
                transactions: {
                    none: {
                        utorid: user.utorid, // make sure user has not used promotion yet in a prior transaction
                    },
                },
            },
        })

        // payload differs based on user role
        var responseData = {}

        if(req.user.role === "cashier"){
            responseData = {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                points: user.points,
                verified: user.verified,
                promotions: availablePromotions
            }
        }
        else{
            responseData = {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                email: user.email,
                birthday: user.birthday,
                role: user.role,
                points: user.points,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                verified: user.verified,
                avatarUrl: user.avatarUrl,
                promotions: availablePromotions
            }
        }

        return res.status(200).json(responseData);
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }

})

router.patch("/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { email, verified, suspicious, role } = req.body;

        const allowedRoles = [ "regular", "cashier", "manager", "superuser"]
        
        // check if user has clearance (manager or higher)
        if(!['manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({"error": "Not authorized"})
        }

        // check if userId is valid
        if(userId < 0 || !Number.isInteger(userId)){
            return res.status(400).json({error: "Invalid userId"})
        }
        
        // get user data
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        })

        // check if user exists
        if(!user){
            return res.status(404).json({error: "User Not found"})
        }

        // check if payload is valid
        const isProvided = (v) => v !== undefined && v !== null;

        if(!isProvided(email) && !isProvided(verified) && !isProvided(suspicious) && !isProvided(role)){
            return res.status(400).json({error: "Empty payload"})
        }

        if((isProvided(email) && typeof email !== "string") || (isProvided(verified) && typeof verified !== "boolean") || (isProvided(suspicious) && typeof suspicious !== "boolean") || (isProvided(role) && typeof role !== "string")){
            return res.status(400).json({"error": "Incorrect type for fields"})
        }

        if(isProvided(email) && !email.endsWith("@mail.utoronto.ca")){
            return res.status(400).json({"error": "Invalid UofT email"})
        }

        if(isProvided(verified) && verified !== true){
            return res.status(400).json({"error": "Verified is not true"})
        }

        if(isProvided(role) && !allowedRoles.includes(role)){
            return res.status(400).json({"error": "Invalid role"})
        }

        // check if email is unique
        const uniqueEmail = await isEmailUnique(email, userId)
        if(email && !uniqueEmail){
            return res.status(400).json({"error": "Email already exists"})
        }

        // check if a manager is attempting to update a manager or superuser
        if(req.user.role === "manager" && ["manager", "superuser"].includes(role)){
            return res.status(403).json({error: "Managers do not have clearance to update managers/superusers"})
        }

        // create the updated json body
        const data = {}
        if(isProvided(email)) data.email = email;
        if(isProvided(verified)) data.verified = verified;
        if(isProvided(suspicious)) data.suspicious = suspicious;
        if(isProvided(role)) { // regular users cannot be promoted to cashier if their initial suspicious value is true
            if(role === "cashier" && user.suspicious === true){
                return res.status(400).json({"error": "Suspicious users cannot be promoted to cashier"})
            }
            data.role = role;
        }

        // update the database
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data,
        });

        return res.status(200).json(updatedUser);
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

////////////////////////////// /USERS/:USERID/TRANSACTIONS
router.post("/:userId/transactions", async (req, res) => {
    try {
        // check if user has clearance (regular or higher)
        if(!['regular', 'cashier', 'manager', 'superuser'].includes(req.user.role)){
            return res.status(403).json({"error": "Not authorized"})
        }

        const { type, amount, remark } = req.body;
        const userId = Number(req.params.userId);

        // check if userId is valid
        if(userId < 0 || !Number.isInteger(userId)){
            return res.status(400).json({error: "Invalid userId"})
        }
        
        // get user data
        const recipient = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        })

        // check if user exists
        if(!recipient){
            return res.status(404).json({error: "User Not found"})
        }

        // check validity of payload
        if(!type || typeof type !== "string" || type !== "transfer" || !amount || typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0 || (remark && typeof remark !== "string")){
            return res.status(400).json({error: "Missing or incorrect field types"})
        }

        // check if sender has enough points
        const sender = await prisma.user.findUnique({
            where: {
                utorid: req.user.utorid
            }
        })

        if(sender.points < amount){
            return res.status(400).json({error: "Sender does not have enough points"});
        }

        // check if sender is verified
        if(!sender.verified){
            return res.status(403).json({error: "Sender is not verified"});
        }

        // update the sender/recipient's points
        // update sender
        await prisma.user.update({
            where:{
                utorid: req.user.utorid
            },
            data:{
                points: {
                    decrement: amount
                }
            }
        })

        //update recipient
        await prisma.user.update({
            where: {
                id: userId 
            },
            data: {
                points: {
                    increment: amount
                }
            }
        })

        // create the transactions
        const sendTransaction = await prisma.transaction.create({
            data: {
                type: type,
                utorid: sender.utorid,
                remark: remark || "",
                amount: amount,
                relatedId: recipient.id,
                processed: false,
                createdBy: req.user.utorid,
            }
        });

        const receiveTransaction = await prisma.transaction.create({
            data: {
                type: type,
                utorid: recipient.utorid,
                remark: remark,
                amount: amount,
                relatedId: sender.id,
                processed: false,
                createdBy: req.user.utorid,
            }
        })

        return res.status(201).json({
            id: sendTransaction.id,
            sender: req.user.utorid,
            recipient: recipient.utorid,
            type: "transfer",
            sent: amount,
            remark: remark,
            createdBy: req.user.utorid
        });
    }
    catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

/////////////////////////////////////////////////////////////////////////// HELPER FUNCTIONS
// check if an email is unique
// `exclude` is a utorid to exclude that user from the uniqueness check
async function isEmailUnique(email, exclude){
    if(!email) return true;
    const where = { email };
    if (exclude !== undefined && exclude !== null) {
        if (typeof exclude === 'number') {
            where.NOT = { id: exclude };
        } else if (typeof exclude === 'string') {
            where.NOT = { utorid: exclude };
        }
    }
    const sameEmail = await prisma.user.findMany({ where });
    return sameEmail.length === 0;
}

module.exports = router;