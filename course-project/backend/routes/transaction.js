const express = require("express");
const router = express.Router();
const {v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticate");
const bcrypt = require('bcrypt');

router.use(authenticateToken);

require('dotenv').config();

///////////////////////////////////// /TRANSACTIONS
router.post("/", async (req, res) => {
    try {
        if(req.body.type === "purchase"){
            const { utorid, type, spent, promotionIds, remark } = req.body;
            console.log("received promo is", promotionIds)

            // check if the user has proper clearance (must be cashier or higher)
            if (!["cashier", "manager", "superuser"].includes(req.user.role)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // check validity of payload
            if(!utorid || !type || spent  === undefined){
                return res.status(400).json({ error: "Missing fields" });
            }

            if(typeof utorid !== "string" || typeof type !== "string" || typeof spent !== "number" || (promotionIds && !Array.isArray(promotionIds)) || (remark && typeof remark !== "string")){
                return res.status(400).json({ error: "Incorrect type for fields" });
            }
            
            // check if spent value is valid
            if(spent <= 0){
                return res.status(400).json({ error: "Invalid 'spent' value" });
            }

            // check if utorid is valid
            if(!await doesUtoridExist(utorid)){
                return res.status(404).json({error: "User Not found"})
            }

            // check if promotion ids are valid
            const validPromos = await arePromotionIdsValid(promotionIds, utorid, spent, type);

            if(promotionIds && !(validPromos)){
                return res.status(400).json({ error: "Invalid promotion ids" });
            }

            // calculate points
            let totalPoints = Math.round(spent/0.25);

            if(promotionIds){
                for(const id of promotionIds){ // go through all promotions that are applied to the transaction
                    const p = await prisma.promotion.findUnique({ // find the promotion
                        where:{
                            id: id,
                        },
                    });
                    if(!p) continue;

                    let promoRate = p.rate;
                    if(p.rate === null) promoRate = 1;
                    totalPoints += (p.points || 0) + Math.round(spent/promoRate); // add the points to the total
                }
            }

            // create the new transaction in the database
            const transaction = await prisma.transaction.create({
                data: {
                    utorid: utorid,
                    type: type,
                    spent: spent,
                    remark: remark,
                    amount: totalPoints, 
                    createdBy: req.user.utorid,
                    promotions: promotionIds ? {
                        connect: promotionIds.map((id) => ({ id})),
                    }
                    : undefined,
                    
                    processed: false //idk if this is right either

                }
            })

            // add the earned amount to the user's points balance
            const loggedinUser = await prisma.user.findUnique({ // find the logged in user
                where: {
                    utorid: req.user.utorid,
                },
            })
            
            var suspiciousCashier = false;
            if(!(req.user.role === "cashier" && loggedinUser.suspicious)){ // only update user's points if the cashier is not suspicious
                await prisma.user.update({
                    where: {
                        utorid: utorid,
                    },
                    data: {
                        points: {
                            increment: totalPoints // add the points from this transaction to the user's total
                        }
                    }
                });
            }
            else{
                console.log("Logged in user is a cashier and suspicious")
                const t = await prisma.transaction.update({ // mark transaction as suspicious
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        suspicious: true
                    }
                })
                suspiciousCashier = true;
            }
            
            return res.status(201).json({
                id: transaction.id,
                utorid: transaction.utorid,
                type: transaction.type,
                spent: transaction.spent,
                earned: suspiciousCashier ? 0 : transaction.amount,
                suspicious: suspiciousCashier ? true : false,
                remark: transaction.remark || "",
                promotionIds: promotionIds || [],
                createdBy: transaction.createdBy
            })
        }
        else if(req.body.type === "adjustment"){
            // check if the user has proper clearance (must be manager or higher)
            if (!["manager", "superuser"].includes(req.user.role)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            const {utorid, type, amount, relatedId, promotionIds, remark} = req.body;

            // check validity of payload
            if(!utorid || amount === undefined || relatedId === undefined){
                return res.status(400).json({ error: "Missing fields" });
            }

            if(typeof utorid !== "string" || typeof amount !== "number" || typeof relatedId !== "number" || (promotionIds && !Array.isArray(promotionIds)) || (remark && typeof remark !== "string")){
                return res.status(400).json({ error: "Incorrect type for fields" })
            }

            if(!await doesUtoridExist(utorid)){
                return res.status(404).json({ error: "Invalid utorid" })
            }

            // check if promotion ids are valid
            if(promotionIds && !(await arePromotionIdsValid(promotionIds, utorid, null, type))){
                return res.status(400).json({ error: "Invalid promotion ids" });
            }

            // check if related transaction belongs to the same user
            const relatedTransaction = await prisma.transaction.findUnique({
                where: { id: relatedId },
            })

            if(!relatedTransaction || relatedTransaction.utorid !== utorid){
                return res.status(404).json({ error: "Related transaction not found for this user" });
            }

            // adjust the user's points balance
            await prisma.user.update({
                where:{
                    utorid: utorid,
                },
                data:{
                    points:{
                        increment: amount,
                    },
                },
            });

            // create a transaction
            const transaction = await prisma.transaction.create({
                data: {
                    utorid: utorid,
                    type: type,
                    remark: remark,
                    amount: amount, 
                    relatedId: relatedId,
                    createdBy: req.user.utorid,
                    promotions: promotionIds ? {
                        connect: promotionIds.map((id) => ({ id})),
                    }
                    : undefined,
                    processed: false //idk if this is right either

                }
            })

            return res.status(201).json({
                id: transaction.id,
                utorid: transaction.utorid,
                type: transaction.type,
                amount: transaction.amount,
                relatedId:  transaction.relatedId,
                remark: transaction.remark || "",
                promotionIds: promotionIds || [],
                createdBy: transaction.createdBy
            })
        }
        else{
            return res.status(400).json({ error: "Incorrect or missing purchase type" });
        }
        
    } catch(err) {
        console.log("Error:", err)
        return res.status(500).json({error: "Internal server error"})
    }
})

router.get("/", async (req, res) => {
    try {
        const { name, utorid, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page, limit, sortBy: sortByRaw, sortOrder: sortOrderRaw } = req.query;

        // typecasted field values
        let suspiciousBool;
        let promotionIdNum;
        let relatedIdNum;
        let amountNum;
        let pageNum = 1;
        let limitNum = 10;

        const allowedTypes = ['purchase', 'redemption', 'adjustment', 'event', 'transfer'];

        // check if user has clearance (must be manager or higher)
        if (!['manager', 'superuser'].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // check validity of fields
        if ((name && typeof name !== 'string') || (utorid && typeof utorid !== 'string') || (createdBy && typeof createdBy !== 'string')) {
            return res.status(400).json({ error: "Incorrect type for fields" });
        }

        // Suspicious
        if (suspicious) {
            if (suspicious === 'true') suspiciousBool = true;
            else if (suspicious === 'false') suspiciousBool = false;
            else return res.status(400).json({ error: "Incorrect type for 'suspicious'" });
        }

        // Promotion ID
        if (promotionId) {
            promotionIdNum = Number(promotionId);
            if (!Number.isInteger(promotionIdNum) || promotionIdNum < 1) {
                return res.status(400).json({ error: "Invalid promotionId" });
            }
        }

        // Type
        if (type && (!allowedTypes.includes(type) || typeof type !== "string")) {
            return res.status(400).json({ error: "Invalid type" });
        }

        // Related ID (must have type)
        if (relatedId) {
            if (!type) return res.status(400).json({ error: "Missing type" });
            relatedIdNum = Number(relatedId);
            if (!Number.isInteger(relatedIdNum) || relatedIdNum < 1) {
                return res.status(400).json({ error: "Invalid relatedId" });
            }
        }

        // Amount/operator
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

        // Pagination
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

        if (name) {
            const users = await prisma.user.findMany({
                where: { OR: [{ name: { contains: name } }, { utorid: { contains: name } }] },
                select: { utorid: true },
            });
            const matchingUtorids = users.map(u => u.utorid);
            if (matchingUtorids.length === 0) {
                return res.status(200).json({ count: 0, results: [] });
            }
            where.utorid = { in: matchingUtorids };
        }

        if (utorid) {
            where.utorid = { contains: utorid };
        }

        if (createdBy) where.createdBy = { contains: createdBy };
        if (suspiciousBool !== undefined) where.suspicious = suspiciousBool;
        if (promotionIdNum !== undefined) where.promotions = { some: { id: promotionIdNum } };
        if (type) where.type = type;
        if (relatedIdNum !== undefined) where.relatedId = relatedIdNum;
        if (amountNum !== undefined) where.amount = { [operator]: amountNum };

        // determine ordering
        const allowedSorts = ['id', 'utorid', 'createdBy', 'promotionId', 'type', 'amount', 'spent', 'relatedId', 'suspicious', 'processed', 'processedBy', 'eventId'];
        let orderBy = { id: 'desc' };
        if (sortByRaw) {
            const dir = (String(sortOrderRaw || '').toLowerCase() === 'desc') ? 'desc' : 'asc';
            if (allowedSorts.includes(String(sortByRaw))) {
                orderBy = { [String(sortByRaw)]: dir };
            }
        }

        // query database
        const count = await prisma.transaction.count({ where });
        const skip = (pageNum - 1) * limitNum;

        let transactions = [];
        if (String(sortByRaw) === 'promotionId') {
            const all = await prisma.transaction.findMany({
                where,
                include: { promotions: { select: { id: true, name: true } } },
            });

            const dir = (String(sortOrderRaw || '').toLowerCase() === 'desc') ? -1 : 1;

            const minId = (proms) => {
                if (!proms || proms.length === 0) return dir === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
                return Math.min(...proms.map(p => p.id));
            };

            all.sort((a, b) => {
                const ma = minId(a.promotions);
                const mb = minId(b.promotions);
                if (ma === mb) return 0;
                return ma < mb ? -1 * dir : 1 * dir;
            });

            transactions = all.slice(skip, skip + limitNum);
        } else {
            transactions = await prisma.transaction.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: { promotions: { select: { id: true, name: true } } },
            });
        }

        // resolve related transaction utorids in batch
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
            amount: t.amount,
            type: t.type,
            spent: t.spent ?? undefined,
            promotionIds: t.promotions.map(p => p.id),
            promotionNames: t.promotions.map(p => p.name),
            suspicious: t.suspicious ?? false,
            remark: t.remark || "",
            createdBy: t.createdBy,
            relatedId: t.relatedId ?? undefined,
            relatedUtorid: t.relatedId ? relatedMap[t.relatedId] : undefined,
        }));

        return res.status(200).json({ count, results });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

//////////////////////////////////// /TRANSACTIONS/:TRANSACTIONID
router.get("/:transactionId", async(req, res) =>{
    try{
        // check if user has clearance (must be manager or higher)
        if (!['manager', 'superuser'].includes(req.user.role)) {
        return res.status(403).json({ error: "Not authorized" });
        }

        const transactionId = Number(req.params.transactionId);

        // check if transactionId is valid
        if(transactionId < 0 || !Number.isInteger(transactionId)){
            return res.status(400).json({error: "Invalid transactionId"})
        }

        // check if transactionId exists
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: transactionId,
            },
            include: {
                promotions: {
                    select: {id: true},
                }
            }
        })

        if(!transaction){
            return res.status(404).json({error: "Transaction not found"})
        }

        // if the transaction has a relatedId, resolve that transaction's utorid so frontend can display sender/receiver
        let relatedUtorid;
        if (transaction.relatedId) {
            const relatedTx = await prisma.transaction.findUnique({ where: { id: transaction.relatedId }, select: { utorid: true } });
            if (relatedTx) relatedUtorid = relatedTx.utorid;
        }

        return res.status(200).json({
            id: transactionId,
            utorid: transaction.utorid,
            type: transaction.type,
            spent: transaction.spent,
            amount: transaction.amount,
            promotionIds: transaction.promotions.map(p => p.id),
            promotionNames: transaction.promotions.map(p => p.name),
            suspicious: transaction.suspicious,
            relatedId: transaction.relatedId,
            relatedUtorid: relatedUtorid,
            remark: transaction.remark || "",
            createdBy: transaction.createdBy
        })
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }

})

/////////////////////////////////// /TRANSACTIONS/:TRANSACTIONID/SUSPICIOUS
router.patch("/:transactionId/suspicious", async (req, res) => {
    try {
        const { suspicious } = req.body;

        // check if user has clearance (must be manager or higher)
        if (!['manager', 'superuser'].includes(req.user.role)) {
        return res.status(403).json({ error: "Not authorized" });
        }

        if(suspicious === undefined || typeof suspicious !== "boolean"){
            return res.status(400).json({error: "Missing or incorrect field type"})
        }

        // check if transactionId is valid
        const transactionId = Number(req.params.transactionId);
        if(transactionId < 0 || !Number.isInteger(transactionId)){
            return res.status(400).json({error: "Invalid transactionId"})
        }

        // check if transactionId exists
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: transactionId,
            },
        })

        if(!transaction){
            return res.status(404).json({error: "Transaction not found"})
        }

        const updatedTransaction = await prisma.transaction.update({
            where: {
                id: transactionId,
            },
            data: {
                suspicious: suspicious,
            },
            include: {
                promotions: {
                    select: { id: true, name: true },
                }
            }
        });

        return res.status(200).json({
            id: transactionId,
            utorid: updatedTransaction.utorid,
            type: updatedTransaction.type,
            spent: updatedTransaction.spent,
            amount: updatedTransaction.amount,
            promotionIds: updatedTransaction.promotions.map(p => p.id),
            promotionNames: updatedTransaction.promotions.map(p => p.name),
            suspicious: updatedTransaction.suspicious,
            remark: updatedTransaction.remark || "",
            createdBy: updatedTransaction.createdBy
        })
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }

})

////////////////////////////////// /TRANSACTIONS/:TRANSACTIONID/PROCESSED
router.patch("/:transactionId/processed", async(req, res) => {
    try {
        // check if user has clearance (must be cashier or higher)
        if (!['cashier', 'manager', 'superuser'].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const { processed } = req.body;

        // check validity of payload
        if(processed === undefined || typeof processed !== "boolean" || !processed){
            return res.status(400).json({ error: "Missing or incorrect field type" });
        }

        // check if transactionId is valid
        const transactionId = Number(req.params.transactionId);
        if(transactionId < 0 || !Number.isInteger(transactionId)){
            return res.status(400).json({error: "Invalid transactionId"})
        }

        // check if transactionId exists
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: transactionId,
            },
        })

        if(!transaction){
            return res.status(404).json({error: "Transaction not found"})
        }

        //check if transaction type is redemption
        if(transaction.type !== "redemption"){
            return res.status(400).json({error: "Transaction type is not 'redemption'"})
        }
        if(transaction.processed === true){
            return res.status(400).json({error: "Transaction has already been processed"})
        }

        // process the transaction
        const updatedTransaction = await prisma.transaction.update({
            where:{
                id: transactionId,
            },
            data:{
                processed: true,
                processedBy: req.user.utorid,
            },
        });

        const updatedUser = await prisma.user.update({
            where:{
                utorid: transaction.utorid
            },
            data: {
                points: {
                    decrement: transaction.amount,
                },
            },
        });

        return res.status(200).json({
            id: transactionId,
            utorid: transaction.utorid,
            type: "redemption",
            processedBy: updatedTransaction.processedBy,
            redeemed: updatedTransaction.amount,
            remark: updatedTransaction.remark || "",
            createdBy: transaction.createdBy
        })
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
    
})

//////////////////////////////// HELPER FUNCTIONS
async function arePromotionIdsValid(promotionIds, utorid, spent, type="purchase"){
    console.log(promotionIds)
    for(const id of promotionIds){
        if(typeof id !== "number" || id < 0 || !Number.isInteger(id)){
            return false;
        }

        const where = {
            id: id,
            startTime: {lte: new Date()}, // check the start/end times of the promotion
            endTime: { gte: new Date()},
            transactions: {
                none: {
                    utorid: utorid, //make sure user has not yet used this promotion
                }
            }
        }

        if(type === "purchase"){
            where.OR = [
                { minSpending: null },
                { minSpending: { lte: spent ?? 0 } },
            ]
        }

        const validPromotion = await prisma.promotion.findFirst({
            where
        });

        if(!validPromotion){
            return false;
        }
    }
    return true;
}

async function doesUtoridExist(utorid){
    const user = await prisma.user.findUnique({
        where: {
            utorid: utorid,
        },
    });

    if(!user){
        return false
    }
    return true
}

module.exports = router;