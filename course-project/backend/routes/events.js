const express = require("express");
const router = express.Router();

const {v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = require("../middleware/authenticate");
const e = require("express");

router.use(authenticateToken);

require('dotenv').config();

router.post("/", async(req, res) => { // create new point earning event
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const {name, description, location, startTime, endTime, capacity, points} = req.body; // collect payload
        
        // assertions
        if (!name){
            return res.status(400).json({ "error": "Bad Request: Name is required" });
        }
        if (!description){
            return res.status(400).json({ "error": "Bad Request: Description is required" });
        }
        if (!location){
            return res.status(400).json({ "error": "Bad Request: Location is required" });
        }
        if (!startTime){
            return res.status(400).json({ "error": "Bad Request: Start time is required" });
        }
        if (!endTime){
            return res.status(400).json({ "error": "Bad Request: End time is required" });
        }
        if (!points){
            return res.status(400).json({ "error": "Bad Request: Points is required" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime); 
        const now = new Date();
        if(isNaN(start) || isNaN(end)){ // check if date is in ISO 8601 format
            return res.status(400).json({ "error": "Bad Request: Invalid date format" });
        }

        if (end <= start || end <= now || start < now){ // end must be after start, cannot create an event in the past
            return res.status(400).json({ "error": "Bad Request: Invalid date time" });
        }

        if (capacity < 0){ // capacity must be a postive or null value
            return res.status(400).json({ "error": "Bad Request: Invalid event capacity" });
        }

        if (points <= 0 || !Number.isInteger(points)){ // must be a positive integer
            return res.status(400).json({ "error": "Bad Request: Invalid event points" });
        }

        const new_event = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startTime: start,
                endTime: end,
                capacity: capacity ?? null,
                pointsRemain: points,
                organizers: { connect: [] },  // start with empty organizers
                guests: { connect: [] },      // start with empty guests
            },
            select: {
                id: true,
                name: true,
                description: true,
                location: true,
                startTime: true,
                endTime: true,
                capacity: true,
                pointsRemain: true,
                pointsAwarded: true,
                published: true,
                organizers: {
                select: { id: true, utorid: true, name: true },
                },
                guests: {
                select: { id: true, utoridGuest: true, amount: true },
                },
            },
        });

        return res.status(201).json(new_event);

    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Failed to create the event"});
    }
})

router.get("/", async(req, res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager" && user.role !== "cashier" && user.role !== "regular")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const {name, location, started, ended, showFull = false, page = 1, limit = 10, published} = req.query;
        const where = {};

        const pageNum = Number(page);
        const limitNum = Number(limit);
        if (!Number.isInteger(pageNum) || pageNum < 1) return res.status(400).json({ error: 'Invalid page' });
        if (!Number.isInteger(limitNum) || limitNum < 1) return res.status(400).json({ error: 'Invalid limit' });

        if (name){
            where.name = { contains: name };
        }

        if (location){
            where.location = { contains: location };
        }

        if (started !== undefined){
            const now = new Date()

            if (started === "true") {
                where.startTime = { lt: now }; // endDate < now
            } else {
                where.endTime = { gte: now }; // optionally, not yet ended
            }
        }

        if (ended !== undefined){
            const now = new Date()

            if (ended === "true") {
                where.endTime = { lt: now }; // endDate < now
            } else {
                where.endTime = { gte: now }; // optionally, not yet ended
            }
        }

        if (showFull === 'true') {
            where.capacity = { not: null };
        }

        if (user.role !== "superuser" && user.role !== "manager"){
            where.published = true;
        }
        else{
            if (published !== undefined){

                where.published = published === 'true';
            }
        }
        
        
        const take = limitNum;
        const skip = (pageNum - 1) * take;

        const count = await prisma.event.count({
            where,
        });

        const events = await prisma.event.findMany({
            skip: skip,
            take: take,
            where,
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
            orderBy: { startTime: 'asc'},
        });

        const flatten_guestlist = events.map(event => ({
            ...event,
            guests: event.guests.map(g => g.guest),
        }));

        return res.status(200).json({ count: count, results: flatten_guestlist})
    }
    catch(err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.get("/:eventId", async(req, res) =>{
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager" && user.role !== "cashier" && user.role !== "regular")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const eventId = parseInt(req.params.eventId, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Bad request: Not an integer" });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId},
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

        if (!event || (user.role === "regular" && event.published === false)){
            return res.status(404).json({ "error": "Not Found" });
        }

        const flatten_guestlist = {
            ...event,
            guests: event.guests.map(g => g.guest),
        };

        if (user.role === "regular") {
            const event_regular = {
                id: flatten_guestlist.id,
                name: flatten_guestlist.name,
                description: flatten_guestlist.description,
                location: flatten_guestlist.location,
                startTime: flatten_guestlist.startTime,
                endTime: flatten_guestlist.endTime,
                capacity: flatten_guestlist.capacity,
                organizers: Array.isArray(flatten_guestlist.organizers) ? flatten_guestlist.organizers : [],
                numGuests: Array.isArray(flatten_guestlist.guests) ? flatten_guestlist.guests.length : 0,
            };

            return res.status(200).json(event_regular);
        }
        return res.status(200).json(flatten_guestlist);
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.patch("/:eventId", async(req, res) =>{
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const { name, description, location, startTime, endTime, capacity, points, published} = req.body;
        // update data
        const data = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (location !== undefined) data.location = location;
            if (startTime !== undefined && startTime !== null) data.startTime = new Date(startTime);
            if (endTime !== undefined && endTime !== null) data.endTime = new Date(endTime);
        if (capacity !== undefined) data.capacity = capacity;

        if (points !== undefined){
            if (user.role === "manager"){
                data.__pointsTotal = points;
            }
            else{
                return res.status(403).json({"error": "Not Authorized" });
            }
        }
        if (published !== undefined){
            if (user.role === "manager"){
                data.published = published;
            }
            else{
                return res.status(403).json({"error": "Not Authorized" });
            }            
        } 

        if (Object.keys(data).length === 0){
            return res.status(400).json({ "error": "Nothing updated" });
        }

        const event = await prisma.event.findUnique({
            where: { id: parseInt(req.params.eventId) },
            select: {
                id: true,
                name: true,
                location: true,
                startTime: true,
                endTime: true,
                capacity: true,
                pointsRemain: true,
                pointsAwarded: true,
                published: true,
                guests: true,
            },
        });

        // bad requests
        if (!event){
            return res.status(404).json({ "error": "Not Found" });
        }

        // check if the event has already started or the provided times are in the past
        const now = new Date();
            const providedStart = (startTime !== undefined && startTime !== null) ? new Date(startTime) : null;
            const providedEnd = (endTime !== undefined && endTime !== null) ? new Date(endTime) : null;

        const prospectiveUpdateKeys = Object.entries(data)
            .filter(([k, v]) => v !== null && v !== undefined && event[k] !== v)
            .map(([k]) => k);

        const isPointsOnlyUpdate = prospectiveUpdateKeys.length === 1 && prospectiveUpdateKeys[0] === '__pointsTotal';

        // If this is not a points-only update, enforce the 'no updates after start' rule.
        if (!isPointsOnlyUpdate) {
            if (event.startTime < now || (providedStart && providedStart < now) || (providedEnd && providedEnd < now)) {
                return res.status(400).json({ "error": "Invalid event start time." });
            }
        }

        // Only validate when capacity is provided and not null.
        if (capacity !== undefined && capacity !== null && capacity < event.capacity && (event.guests.length > capacity)){
            // when reducing capacity below number of confirmed guests
            return res.status(400).json({ "error": "Invalid event capacity." });
        }

        if (points !== undefined) {
            const newTotal = Number(points);
            if (!Number.isInteger(newTotal) || newTotal < 0) {
                return res.status(400).json({ "error": "Bad Request: Points must be a non-negative integer" });
            }
            // ensure already-awarded points do not exceed the new total
            if ((event.pointsAwarded ?? 0) > newTotal) {
                return res.status(400).json({ "error": "Bad Request: New total is less than points already awarded" });
            }
        }

        if ((name !== undefined || description !== undefined || location !== undefined || startTime !== undefined || capacity !== undefined) && ((providedStart && providedStart > event.startTime) || (providedEnd && providedEnd > event.endTime))){
            return res.status(400).json({ "error": "Bad Request" });
        }
        // update entries
        const updated = Object.fromEntries(
            Object.entries(data).filter(([key, value]) => event[key] !== value)
        );

        const update_data = {};
        for (const [key, value] of Object.entries(updated)) {
            if (value !== null && value !== undefined) {
                if (key === "__pointsTotal") {
                    // compute pointsRemain = newTotal - pointsAwarded
                    const newTotal = Number(value);
                    const alreadyAwarded = event.pointsAwarded ?? 0;
                    update_data.pointsRemain = newTotal - alreadyAwarded;
                } else {
                    update_data[key] = value;
                }
            }
        }

        const update_event = await prisma.event.update({
            where: { id: parseInt(req.params.eventId, 10) },
            data: update_data,
            select: {
                id: true,
                name: true,
                location: true,
                pointsRemain: update_data.pointsRemain !== undefined ? true : false,
                ...Object.fromEntries(Object.keys(update_data).map(k => [k, true])),
            },
        });

        return res.status(200).json(update_event)
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }

})

router.delete("/:eventId", async(req, res) =>{
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const eventId = parseInt(req.params.eventId, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Bad request: Not an integer" });
        }
        
        const event = await prisma.event.findUnique({
            where: {id: eventId},
            select: { published: true},
        });

        if (event.published){
            return res.status(400).json({ "error": "Bad Request" });
        }

        await prisma.eventGuest.deleteMany({
            where: {eventId: eventId}
        });

        await prisma.event.delete({
            where: { id: eventId}
        });

        return res.sendStatus(200)
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }

})

router.post("/:eventId/organizers", async(req, res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }
    try{
        const eventId = parseInt(req.params.eventId, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: "Bad request: Not an integer" });
        }
        
        const utorid = req.body.utorid;

        if (!utorid){
            return res.status(404).json({ "error": "Bad Request: Missing utorid"});
        }

        const find_user = await prisma.user.findUnique({
            where: { utorid: utorid }
        });

        if (!find_user){
            return res.status(404).json({ "error": "Bad Request: User not found"})
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId},
            include: {
                organizers: true
            }
        });

        if(!event){
            return res.status(404).json({ "error": "Bad Request: Event not found"})
        }

        const now = new Date();
        if (event.endTime < now){
            return res.status(410).json({ "error": "Event has ended"});
        }

        // ensure the user isn't already a guest for this event
        const on_guestlist = await prisma.eventGuest.findFirst({
            where: {
                eventId: eventId,
                utoridGuest: find_user.utorid,
            },
        });

        if (on_guestlist){
            return res.status(400).json({ "error": "Bad Request: Try removing user from guestlist and readding as organizer"})
        }

        const existing_host = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                organizers: {
                where: { utorid: utorid },
                select: { utorid: true },
                },
            },
        });

        if(existing_host?.organizers.length > 0){
            return res.status(400).json({ "error": "Bad Request: User is already a host of this event"})

        }

        await prisma.event.update({
            where: { id: eventId },
            data: {
                organizers: {
                connect: { utorid }, // works now if utorid is unique
                },
            },
            select: {
                id: true,
                name: true,
                location: true,
                organizers: {
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                },
                },
            },
        });
       const hosted_event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                name: true,
                location: true,
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
            },
        });

        return res.status(201).json(hosted_event);
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.delete("/:eventId/organizers/:userId", async(req, res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }
    try{
        const eventId = parseInt(req.params.eventId, 10);
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(eventId)){
            return res.status(400).json({ "error": "Bad Request: Not an integer"});
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { utorid: true },
        });

        if (!user){
            return res.status(400).json({ "error": "User not found"});    
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                organizers: {
                disconnect: { utorid: user.utorid },
                },
            },
            select: {
                id: true,
                name: true,
                organizers: {
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                },
                },
            },
        });
        return res.sendStatus(204);
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.post("/:eventId/guests", async(req, res) => {
    const user = req.user;
    if (!user){ // must be authenticated
        return res.status(403).json({ "error": "Not authorized" });
    }
    
    try{
        const utorid = req.body.utorid;
        
        if (!utorid){
            return res.status(400).json({ "error": "Bad Request: Missing payload"});
        }

        const eventId = parseInt(req.params.eventId, 10);
        
        if (isNaN(eventId)){
            return res.status(400).json({ "error": "Bad Request: Not an integer"});
        }

        // allow if manager/superuser, or if user is an organizer of the event
        if (!(user.role === "superuser" || user.role === "manager")){
            const isOrganizer = await prisma.event.findFirst({
                where: {
                    id: eventId,
                    organizers: { some: { utorid: user.utorid } },
                },
                select: { id: true },
            });
            if (!isOrganizer){
                return res.status(403).json({ "error": "Not authorized" });
            }
        }

        const targetUser = await prisma.user.findUnique({
            where: { utorid: utorid},
            select: {
                id: true,
                utorid: true,
                name: true,
            },
        });

        if (!targetUser){
            return res.status(400).json({ "error": "Bad Request: User not found"});
        }

        const host = await prisma.event.findUnique({
            where: {
                id: eventId,
                organizers: {
                    some: { utorid },
                },
            },
        });

        if (host){
            return res.status(400).json({ "error": "Bad Request: Already an organizer"});
        }

        const on_guestlist = await prisma.eventGuest.findUnique({
            where: {
                eventId_utoridGuest: {
                eventId,
                utoridGuest: utorid,
                },
            },
        });

        if(on_guestlist){
            return res.status(400).json({ error: "Bad Request: Already a guest" });
        }

        // fetch event details and current guest count before creating a new guest
        const guestlist = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                name: true,
                location: true,
                published: true,
                capacity: true,
                endTime: true,
                guests: {
                    select: {
                        guest: {   // select the related User
                            select: {
                                id: true,
                                name: true,
                                utorid: true,
                            },
                        },
                    },
                },
            },
        });

        if (!guestlist){
            return res.status(404).json({ "error": "Not Found" });
        }

        if (guestlist.published === false){
            return res.status(404).json({ "error": "Not Found"});
        }

        const now = new Date();
        if (guestlist.endTime < now){
            return res.status(410).json({ "error": "Event ended"});
        }

        if (guestlist.capacity !== null && guestlist.guests.length >= guestlist.capacity){
            // already full, don't create
            return res.status(410).json({ "error": "Event is full"});
        }

        // safe to create guest
        await prisma.eventGuest.create({
            data: {
                event: { connect: { id: eventId } },
                guest: { connect: { utorid } },
                amount: 0,
            },
        });

        // re-fetch to get updated guest count and include the newly added guest
        const updatedGuestlist = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                guests: {
                    select: {
                        guest: {
                            select: { id: true, name: true, utorid: true }
                        }
                    }
                }
            }
        });

        const updated_event = {
            id: updatedGuestlist.id,
            name: updatedGuestlist.name,
            location: updatedGuestlist.location,
            guestAdded: targetUser,
            numGuests: updatedGuestlist.guests.length,
        }

        return res.status(201).json(updated_event);
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.delete("/:eventId/guests/me", async(req, res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager" && user.role !== "cashier" && user.role !== "regular")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }

    try{
        const eventId = Number(req.params.eventId);
        if(!Number.isInteger(eventId)){
            return res.status(400).json({ "error": "Bad Request: Not an integer"});
        }

        const event = await prisma.event.findUnique({
            where: {id : eventId},
            select:{
                id: true,
                name: true,
                location: true,
                endTime: true,
                capacity: true,
                guests: true
            },
        });

        if (!event){
            return res.status(404).json({ "error" : "Event not Found"});
        }

        const on_list = await prisma.eventGuest.findUnique({
            where: {
                eventId_utoridGuest:{
                    eventId,
                    utoridGuest: user.utorid,
                },
            },
        });

        if (!on_list){
            return res.status(404).json({ "error": "Not Found: Not a guest at the event" });
        }

        const now = new Date();
        if (event.endTime < now){
            return res.status(410).json({ "error": "Gone: Event has alreadu ended"});
        }

        await prisma.eventGuest.delete({
            where: {
                eventId_utoridGuest: {
                eventId: eventId,
                utoridGuest: user.utorid,
                },
            },
        });

        return res.sendStatus(204);

    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.delete("/:eventId/guests/:userId", async (req,res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }
    
    try{
        const eventId = parseInt(req.params.eventId, 10);
        const userId = parseInt(req.params.userId, 10);

        if (isNaN(eventId) || isNaN(userId)){
            return res.status(400).json({ "error": "Bad Request: Not an integer" });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId},
            select: {
                guests: true,
            },
        });

        if (!event){
            return res.status(400).json({ "error": "Bad Request: Event doesn't exist" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId},
        });

        if(!user){
            return res.status(400).json({ "error": "Bad Request: User doesn't exist" });
        }

        await prisma.eventGuest.delete({
            where: {
                eventId_utoridGuest: {
                eventId: eventId,
                utoridGuest: user.utorid,
                },
            },
        });

        return res.sendStatus(204);

    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.post("/:eventId/guests/me", async(req, res) => {
    const user = req.user;
    if (!user || (user.role !== "superuser" && user.role !== "manager" && user.role !== "cashier" && user.role !== "regular")){ // clearance
        return res.status(403).json({ "error": "Not authorized" });
    }
    
    try{
        const eventId = parseInt(req.params.eventId, 10);
        if(isNaN(eventId)){
            return res.status(400).json({ "error": "Bad Request: Not an integer"});
        }

        const event = await prisma.event.findUnique({
            where: {id : eventId},
            select:{
                id: true,
                name: true,
                location: true,
                endTime: true,
                capacity: true,
                guests: true
            },
        });

        if (!event){
            return res.status(404).json({ "error" : "Event not Found"});
        }

        const guest = await prisma.eventGuest.findUnique({
            where: {
                eventId_utoridGuest:{
                    eventId,
                    utoridGuest: user.utorid,
                },
            },
        });

        if (guest){
            return res.status(400).json({ "error": "Bad Request: Already on the list"});
        }

        const now = new Date();
        if (event.endTime < now){
            return res.status(410).json({ "error": "Gone: Event has alreadu ended"});
        }

        if (event.capacity === event.guests.length){
            return res.status(410).json({ "error": "Gone: Event is full"});
        }

        await prisma.eventGuest.create({
            data: {
                event: { connect: { id: eventId } },
                guest: { connect: { utorid: user.utorid } },
                amount: 0,
            },
        });

        const added = await prisma.event.findUnique({
            where: {id: eventId},
            include: {
                guests: true,
            },
        });

        const user_guest = await prisma.user.findUnique({
            where: { utorid: user.utorid },
            select:{
                id: true,
                utorid: true,
                name: true,
            },
        });

        const response = {
            id: added.id,
            name: added.name,
            location: added.location,
            guestAdded: user_guest,
            numGuests: added.guests.length,
        };

        return res.status(201).json(response);        
    }
    catch (err){
        console.error(err);
        return res.status(500).json({"error": "Internal Server Error"});
    }
})

router.post("/:eventId/transactions", async (req, res) => {
    try {
        const user = req.user;
        const eventId = Number(req.params.eventId);

        if (!Number.isInteger(eventId)) {
            return res.status(400).json({ error: "Bad Request: Not an integer" });
        }

        // Authorization: manager/superuser always allowed, organizer allowed too
        let authorized = false;
        if (["manager", "superuser"].includes(user.role)) {
            authorized = true;
        } 
        else {
            const organizer = await prisma.event.findFirst({
                where: { id: eventId, organizers: { some: { utorid: user.utorid } } },
            });
            if (organizer) authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const { type, utorid, amount, remark } = req.body;

        // Validate payload
        if (type !== "event" || !amount || amount <= 0 || !Number.isInteger(amount)) {
            return res.status(400).json({ error: "Bad Request: Invalid payload" });
        }

        // Get event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true },
        });

        if (!event) {
            return res.status(404).json({ error: "Not Found: Event not found" });
        }

        // Check points remain
        if (amount > event.pointsRemain) {
            return res.status(400).json({ error: "Bad Request: Not enough remaining points" });
        }

        // CASE 1: awarding to one specific guest 
        if (utorid) {
            const guest = await prisma.eventGuest.findUnique({
                where: {
                    eventId_utoridGuest: {
                    eventId,
                    utoridGuest: utorid,
                    },
                },
            });

            if (!guest) {
                return res.status(400).json({ error: "Bad Request: This utorid is not on the guestlist" });
            }


            const createdTransaction = await prisma.transaction.create({
                data: {
                    utorid,
                    type,
                    amount,
                    relatedId: eventId,
                    remark,
                    createdBy: user.utorid,
                    processed: true,
                },
                select: {
                    id: true,
                    utorid: true,
                    type: true,
                    amount: true,
                    relatedId: true,
                    remark: true,
                    createdBy: true,
                },
            });

            // decrement pointsRemain and increment pointsAwarded 
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: { decrement: amount },
                    pointsAwarded: { increment: amount },
                },
            });

            // award to guest
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


            return res.status(201).json({
                id: createdTransaction.id,
                recipient: createdTransaction.utorid,
                awarded: createdTransaction.amount,
                type: createdTransaction.type,
                relatedId: createdTransaction.relatedId,
                remark: createdTransaction.remark,
                createdBy: createdTransaction.createdBy,
            });
        }

        // CASE 2: awarding to all guests
        const guestlist = await prisma.eventGuest.findMany({
            where: { eventId },
            select: { id: true, utoridGuest: true },
        });

        if (guestlist.length === 0) {
            return res.status(400).json({ error: "Bad Request: No guests in event" });
        }

        // Check total cost of awarding everyone
        const totalPointsNeeded = guestlist.length * amount;
        if (totalPointsNeeded > event.pointsRemain) {
            return res.status(400).json({ error: "Bad Request: Not enough remaining points" });
        }

        // create transaction rows for all guests (utorid can be null)
        const transactionData = guestlist.map(g => ({
            utorid: g.utoridGuest ?? null,
            type,
            amount,
            relatedId: eventId,
            remark,
            createdBy: user.utorid,
            processed: true,
        }));

        await prisma.transaction.createMany({ data: transactionData });

        // increment points for guests that have a utorid; otherwise increment the EventGuest.amount field
        for (const g of guestlist) {
            if (g.utoridGuest) {
                await prisma.user.update({
                    where: { utorid: g.utoridGuest },
                    data: { points: { increment: amount } },
                });
            } else {
                await prisma.eventGuest.update({
                    where: { id: g.id },
                    data: { amount: { increment: amount } },
                });
            }
        }

        // decrement pointsRemain and increment pointsAwarded
        await prisma.event.update({
            where: { id: eventId },
            data: {
                pointsRemain: { decrement: totalPointsNeeded },
                pointsAwarded: { increment: totalPointsNeeded },
            },
        });

        // Re-fetch created transactions to build proper response
        const transactions = await prisma.transaction.findMany({
            where: { relatedId: eventId, createdBy: user.utorid, type },
            select: {
                id: true,
                utorid: true,
                amount: true,
                type: true,
                relatedId: true,
                remark: true,
                createdBy: true,
            },
            orderBy: { id: 'desc' },
            take: transactionData.length,
        });

        const response = transactions.map((t) => ({
            id: t.id,
            recipient: t.utorid,
            awarded: t.amount,
            type: t.type,
            relatedId: t.relatedId,
            remark: t.remark,
            createdBy: t.createdBy,
        }));

        return res.status(201).json(response);
    } 
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;