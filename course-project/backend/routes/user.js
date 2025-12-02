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
        if (!["cashier", "manager", "superuser"].includes(req.user.role)) {
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
            utorid: utoridFilter,
            name: nameFilter,
            role: roleFilter,
            email: emailFilter,
            verified: verifiedRaw,
            activated: activatedRaw,
            suspicious: suspiciousRaw,
            page: pageRaw = '1',
            limit: limitRaw = '10',
            sortBy: sortByRaw,
            sortOrder: sortOrderRaw,
        } = req.query;

        // check if user is authenticated and has some role
        if(!req.user || !req.user.role){
            return res.status(403).json({"error": "Not authorized"})
        }

        // Managers/superusers can always see all users
        // Regular users can only see users list if they are organizers of at least one event
        if(req.user.role === 'regular') {
            const isOrganizer = await prisma.event.findFirst({
                where: {
                    organizers: { some: { utorid: req.user.utorid } },
                },
                select: { id: true },
            });
            if (!isOrganizer) {
                return res.status(403).json({"error": "Not authorized"})
            }
        } else if(!['manager', 'superuser', 'cashier'].includes(req.user.role)){
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
        let suspicious;
        if (suspiciousRaw !== undefined) {
            const a = String(suspiciousRaw).toLowerCase();
            if (a === 'true') suspicious = true;
            else if (a === 'false') suspicious = false;
            else return res.status(400).json({ error: 'Incorrect type for fields' });
        }

        // extract filter data
        const where = {};
        if (utoridFilter) where.utorid = {contains: utoridFilter};
        if (nameFilter) where.name = {contains: nameFilter};
        if (emailFilter) where.email = {contains: emailFilter};
        if (roleFilter) where.role = roleFilter;
        if (verified !== undefined) where.verified = verified;
        if (activated !== undefined) where.activated = activated;
        if (suspicious !== undefined) where.suspicious = suspicious;

        const pageNum = page;
        const take = limit;
        const skip = (pageNum - 1) * take;

        // apply filter to find users
        //find the total count BEFORE pagination
        const count = await prisma.user.count({
            where,
        });

        //apply filter with pagination
        const allowedSorts = ['id','utorid','name','email','birthday','role','points','createdAt','lastLogin','verified','activated','suspicious'];
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
                email: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                activated: true,
                suspicious: true,
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

        // find events where user is an organizer
        const organizedEvents = await prisma.event.findMany({
            where: {
                organizers: {
                    some: { utorid: req.user.utorid }
                }
            },
            include: {
                organizers: {
                    select: {
                        id: true,
                        name: true,
                        utorid: true,
                    },
                },
                guests: {
                    select: {
                        guest: {
                            select: {
                                id: true,
                                name: true,
                                utorid: true,
                            } 
                        },
                    },
                },
            },
        });

        // find events where user is a guest
        const guestEvents = await prisma.event.findMany({
            where: {
                guests: {
                    some: { utoridGuest: req.user.utorid }
                }
            },
            include: {
                organizers: {
                    select: {
                        id: true,
                        name: true,
                        utorid: true,
                    },
                },
                guests: {
                    select: {
                        guest: {
                            select: {
                                id: true,
                                name: true,
                                utorid: true,
                            } 
                        },
                    },
                },
            },
        });

        // flatten the guests lists
        const flattenedOrganizedEvents = organizedEvents.map(event => ({
            ...event,
            guests: event.guests.map(g => g.guest),
        }));

        const flattenedGuestEvents = guestEvents.map(event => ({
            ...event,
            guests: event.guests.map(g => g.guest),
        }));

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
            promotions: promotions,
            organizedEvents: flattenedOrganizedEvents,
            guestEvents: flattenedGuestEvents,
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

// lookup user accessible to regular users - returns minimal info
router.get('/lookup/:utorid', async (req, res) => {
    try {
        const utorid = req.params.utorid;
        if (!utorid || typeof utorid !== 'string') return res.status(400).json({ error: 'Invalid utorid' });

        // allow regular users to lookup by utorid
        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.status(200).json({ id: user.id, utorid: user.utorid, name: user.name });
    } catch (err) {
        console.error('Error looking up user:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/////////////////////////////// /USERS/LOOKUP/:UTORID/REDEMPTIONS
// For cashiers to view pending redemptions of a user
router.get('/lookup/:utorid/redemptions', async (req, res) => {
    try {
        const utorid = req.params.utorid;
        
        // check if user has clearance (must be cashier or higher)
        if (!['cashier', 'manager', 'superuser'].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        if (!utorid || typeof utorid !== 'string') {
            return res.status(400).json({ error: 'Invalid utorid' });
        }

        // check if the user exists
        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // fetch pending redemptions for this user
        const redemptions = await prisma.transaction.findMany({
            where: {
                utorid: utorid,
                type: 'redemption',
                processed: false
            }
        });

        return res.status(200).json({ results: redemptions });
    } catch (err) {
        console.error('Error fetching user redemptions:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/////////////////////////////// /USERS/ME/PASSWORD
router.patch("/me/password", async (req, res) =>{

    try{
        const { old, new: newPassword } = req.body;
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
    const {type, relatedId, promotionId, amount, operator, amountMin, amountMax, spentMin, spentMax, page, limit, createdBy, remark, sortBy: sortByRaw, sortOrder: sortOrderRaw, asRole, processed} = req.query;

        const utorid = req.user.utorid // get utorid of the logged in user
        
        // Determine the effective role for filtering
        // If asRole is provided and user has the actual role to back it up, use asRole for filtering
        let effectiveRole = req.user.role;
        if (asRole && ['manager', 'cashier', 'superuser'].includes(req.user.role)) {
            // Managers, cashiers, and superusers can view as regular to see filtered view
            if (asRole === 'regular') {
                effectiveRole = 'regular';
            }
        }

        
        // check validity of payload
        if(type && !allowedTypes.includes(type)){
            return res.status(400).json({error: "Invalid type"})
        }
        
        // validate string fields
        if ((createdBy && typeof createdBy !== 'string') || (remark && typeof remark !== 'string')) {
            return res.status(400).json({ error: "Incorrect type for fields" });
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

        // amount range
        let amountMinNum, amountMaxNum, spentMinNum, spentMaxNum;
        if (amountMin !== undefined || amountMax !== undefined) {
            if (amountMin !== undefined) {
                amountMinNum = Number(amountMin);
                if (isNaN(amountMinNum)) return res.status(400).json({ error: "Invalid amountMin" });
            }
            if (amountMax !== undefined) {
                amountMaxNum = Number(amountMax);
                if (isNaN(amountMaxNum)) return res.status(400).json({ error: "Invalid amountMax" });
            }
        }

        // spent range
        if (spentMin !== undefined || spentMax !== undefined) {
            if (spentMin !== undefined) {
                spentMinNum = Number(spentMin);
                if (isNaN(spentMinNum)) return res.status(400).json({ error: "Invalid spentMin" });
            }
            if (spentMax !== undefined) {
                spentMaxNum = Number(spentMax);
                if (isNaN(spentMaxNum)) return res.status(400).json({ error: "Invalid spentMax" });
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
        let where = {};
        
        // For 'event' type transactions, show both where user is recipient (utorid) OR creator (createdBy)
        // For other types, show where user is recipient OR created the transaction (for cashiers)
        // Also include transactions processed by user (for cashiers viewing processed redemptions)
        if (type === 'event') {
            // Show event transactions where user is either recipient or organizer
            where = {
                type: 'event',
                OR: [
                    { utorid: utorid },
                    { createdBy: utorid }
                ]
            };
        } else if (type) {
            where.type = type;
            // For redemptions, regular users should only see their own redemptions
            // For other transaction types, users can see ones they created or received
            if (type === 'redemption' && !['cashier', 'manager', 'superuser'].includes(effectiveRole)) {
                where.utorid = utorid;
            } else {
                where.OR = [
                    { utorid: utorid },
                    { createdBy: utorid },
                    { processedBy: utorid }
                ];
            }
        } else {
            // If no type specified, show:
            // - All non-event transactions where user is recipient OR created it OR processed it
            // - All event transactions where user is either recipient or organizer
            where = {
                OR: [
                    { 
                        type: { not: 'event' },
                        OR: [
                            { utorid: utorid },
                            { createdBy: utorid },
                            { processedBy: utorid }
                        ]
                    },
                    {
                        type: 'event',
                        OR: [
                            { utorid: utorid },
                            { createdBy: utorid }
                        ]
                    }
                ]
            };
        }
        
        // Filter out suspicious transactions for regular users and unprocessed redemptions
        if (!['cashier', 'manager', 'superuser'].includes(effectiveRole)) {
            where.suspicious = false;
            
            // For regular users, if they're looking at redemptions, allow them to filter by processed status
            // If no processed filter is provided, only show processed ones by default
            if (type === 'redemption') {
                if (processed === undefined) {
                    where.processed = true;
                } else if (processed === 'true') {
                    where.processed = true;
                } else if (processed === 'false') {
                    where.processed = false;
                }
            } else if (!type) {
                // When no type is specified, exclude unprocessed redemptions
                where = {
                    AND: [
                        where,
                        {
                            OR: [
                                { type: { not: 'redemption' } },
                                { processed: true }
                            ]
                        }
                    ]
                };
            }
        }
        
        if (promotionIdNum !== undefined) where.promotions = { some: { id: promotionIdNum } };
        if (relatedIdNum !== undefined) where.relatedId = relatedIdNum;
        if (createdBy) where.createdBy = { contains: createdBy };
        if (remark) where.remark = { contains: remark };
        if (amountNum !== undefined) {
            where.amount = { [operator]: amountNum };
        } else {
            if (amountMinNum !== undefined || amountMaxNum !== undefined) {
                where.amount = {};
                if (amountMinNum !== undefined) where.amount.gte = amountMinNum;
                if (amountMaxNum !== undefined) where.amount.lte = amountMaxNum;
            }
        }

        if (spentMinNum !== undefined || spentMaxNum !== undefined) {
            where.spent = {};
            if (spentMinNum !== undefined) where.spent.gte = spentMinNum;
            if (spentMaxNum !== undefined) where.spent.lte = spentMaxNum;
        }

        // query database
        const count = await prisma.transaction.count({ where });
        const skip = (pageNum - 1) * limitNum;

        // determine ordering
        const allowedSorts = ['id', 'utorid', 'createdBy', 'type', 'amount', 'spent', 'relatedId'];
        let orderBy = { id: 'desc' }; // default
        if (sortByRaw && allowedSorts.includes(String(sortByRaw))) {
            const dir = (String(sortOrderRaw || '').toLowerCase() === 'desc') ? 'desc' : 'asc';
            orderBy = { [String(sortByRaw)]: dir };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            skip,
            take: limitNum,
            orderBy,
            include: { promotions: { select: { id: true, name: true } } },
        });

        // batch-resolve related transaction utorids
        const relatedIds = Array.from(new Set(transactions.map(t => t.relatedId).filter(Boolean)));
        let relatedMap = {};
        if (relatedIds.length > 0) {
            const relatedTxs = await prisma.transaction.findMany({
                where: { id: { in: relatedIds } },
                select: { id: true, utorid: true }
            });
            relatedMap = relatedTxs.reduce((acc, rt) => {
                acc[rt.id] = rt.utorid;
                return acc;
            }, {});
        }

        // format response
        const results = transactions.map(t => ({
            id: t.id,
            utorid: t.utorid,
            type: t.type,
            spent: t.spent ?? undefined,
            relatedId: t.relatedId ?? undefined,
            relatedUtorid: t.relatedId ? relatedMap[t.relatedId] : undefined,
            amount: t.amount,
            promotionIds: t.promotions.map(p => p.id),
            promotionNames: t.promotions.map(p => p.name),
            remark: t.remark || "",
            createdBy: t.createdBy,
            processed: t.processed ?? false,
            processedBy: t.processedBy ?? null
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
                processed: false,
                createdBy: req.user.utorid,
            }
        });

        // create the recipient transaction with relatedId pointing to sender transaction id
        const receiveTransaction = await prisma.transaction.create({
            data: {
                type: type,
                utorid: recipient.utorid,
                remark: remark,
                amount: amount,
                relatedId: sendTransaction.id,
                processed: false,
                createdBy: req.user.utorid,
            }
        });

        // update the sender transaction to point to the receive transaction id
        await prisma.transaction.update({
            where: { id: sendTransaction.id },
            data: { relatedId: receiveTransaction.id },
        });

        return res.status(201).json({
            id: sendTransaction.id,
            relatedId: receiveTransaction.id,
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