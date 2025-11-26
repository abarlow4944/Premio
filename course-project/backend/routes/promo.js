const express = require("express");
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = require("../middleware/authenticate");

router.use(authenticateToken);

require('dotenv').config();

// GET /promotions/stats: Return column-wise maxima for numeric promotion fields
router.get('/stats', async (req, res) => {
	try {
		const agg = await prisma.promotion.aggregate({
			_max: {
				minSpending: true,
				rate: true,
				points: true,
			}
		});

		const maxMinSpending = agg._max.minSpending ?? 0;
		const maxRate = agg._max.rate ?? 0;
		const maxPoints = agg._max.points ?? 0;

		return res.status(200).json({
			maxMinSpending,
			maxRate,
			maxPoints,
		});
	} catch (err) {
		console.error('Error computing promotion stats:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// POST /promotions: Create a new promotion
router.post('/', async (req, res) => {
	try {
		const user = req.user;

		const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

		if (!name || typeof name !== 'string' || !description || typeof description !== 'string' || !type || typeof type !== 'string' || !startTime || !endTime) {
			return res.status(400).json({ error: 'Missing or invalid required fields' });
		}

		let promoType = type.toLowerCase();
		if (promoType === 'one-time') promoType = 'onetime';
		if (!['automatic', 'onetime'].includes(promoType)) {
			return res.status(400).json({ error: 'Invalid promotion type' });
		}

		const start = new Date(startTime);
		const end = new Date(endTime);
		const now = new Date();
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return res.status(400).json({ error: 'Invalid date format' });
		}
		if (start < now) {
			return res.status(400).json({ error: 'startTime must not be in the past' });
		}
		if (end <= start) {
			return res.status(400).json({ error: 'endTime must be after startTime' });
		}

		let minSpendVal = null;
		if (minSpending !== undefined && minSpending !== null) {
			if (typeof minSpending !== 'number' || Number(minSpending) <= 0) {
				return res.status(400).json({ error: 'minSpending must be a positive number' });
			}
			minSpendVal = Math.round(minSpending);
		}

		let rateVal = null;
		if (rate !== undefined && rate !== null) {
			if (typeof rate !== 'number' || Number(rate) <= 0) {
				return res.status(400).json({ error: 'rate must be a positive number' });
			}
			rateVal = rate;
		}

		let pointsVal = null;
		if (points !== undefined && points !== null) {
			if (typeof points !== 'number' || !Number.isInteger(points) || points < 0) {
				return res.status(400).json({ error: 'points must be a non-negative integer' });
			}
			pointsVal = points;
		}

		// check for clearance (must be manager or higher)
		if (!user || !['manager', 'superuser'].includes(user.role)) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		const created = await prisma.promotion.create({
			data: {
				name,
				description,
				type: promoType,
				startTime: start,
				endTime: end,
				minSpending: minSpendVal,
				rate: rateVal ?? null,
				points: pointsVal,
			},
		});

		return res.status(201).json({
			id: created.id,
			name: created.name,
			description: created.description,
			type: created.type,
			startTime: created.startTime,
			endTime: created.endTime,
			minSpending: created.minSpending ?? null,
			rate: created.rate ?? null,
			points: created.points ?? 0,
		});
	} catch (err) {
		console.error('Error creating promotion:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// GET /promotions: Retrieve a list of promotions
router.get('/', async (req, res) => {
	try {
		const user = req.user;

		const {
			name: nameFilter,
			description: descriptionFilter,
			type: typeFilter,
			minSpendingMin: minSpendingMinRaw,
			minSpendingMax: minSpendingMaxRaw,
			rateMin: rateMinRaw,
			rateMax: rateMaxRaw,
			pointsMin: pointsMinRaw,
			pointsMax: pointsMaxRaw,
			page: pageRaw = '1',
			limit: limitRaw = '10',
			started: startedRaw,
			ended: endedRaw,
			sortBy: sortByRaw,
			sortOrder: sortOrderRaw,
		} = req.query;

		const page = Number(pageRaw);
		const limit = Number(limitRaw);
		if (!Number.isInteger(page) || page < 1) return res.status(400).json({ error: 'Invalid page' });
		if (!Number.isInteger(limit) || limit < 1) return res.status(400).json({ error: 'Invalid limit' });

		const where = {};

		if (nameFilter && typeof nameFilter === 'string') {
			where.name = { contains: nameFilter };
		}

		if (descriptionFilter && typeof descriptionFilter === 'string') {
			where.description = { contains: descriptionFilter };
		}

		if (typeFilter && typeof typeFilter === 'string') {
			let normalized = typeFilter.toLowerCase();
			if (normalized === 'one-time') normalized = 'onetime';
			if (!['automatic', 'onetime'].includes(normalized)) return res.status(400).json({ error: 'Invalid type filter' });
			where.type = normalized;
		}

		// numeric range filters
		const parseNum = (v) => {
			if (v === undefined) return undefined;
			const n = Number(v);
			return Number.isNaN(n) ? undefined : n;
		};
		const msMin = parseNum(minSpendingMinRaw);
		const msMax = parseNum(minSpendingMaxRaw);
		const rMin = parseNum(rateMinRaw);
		const rMax = parseNum(rateMaxRaw);
		const pMin = parseNum(pointsMinRaw);
		const pMax = parseNum(pointsMaxRaw);

		const buildNumericFilter = (fieldName, minV, maxV) => {
			if (minV === undefined && maxV === undefined) return undefined;
			const cond = {};
			if (minV !== undefined) cond.gte = minV;
			if (maxV !== undefined) cond.lte = maxV;

			// include nulls if 0 is inside the requested range
			const includeNull = (minV === undefined || minV <= 0) && (maxV === undefined || maxV >= 0);
			if (includeNull) {
				return { OR: [ { [fieldName]: cond }, { [fieldName]: null } ] };
			}
			return { [fieldName]: cond };
		};

		const numericFilters = [];
		const msFilter = buildNumericFilter('minSpending', msMin, msMax);
		if (msFilter) numericFilters.push(msFilter);
		const rFilter = buildNumericFilter('rate', rMin, rMax);
		if (rFilter) numericFilters.push(rFilter);
		const pFilter = buildNumericFilter('points', pMin, pMax);
		if (pFilter) numericFilters.push(pFilter);

		if (numericFilters.length > 0) {
			where.AND = (where.AND || []).concat(numericFilters);
		}

		const now = new Date();

        // Manager-level clearance
		const isManager = (user && ['manager', 'superuser'].includes(user.role));

		const startedFilter = startedRaw === undefined ? undefined : (String(startedRaw).toLowerCase() === 'true');
		const endedFilter = endedRaw === undefined ? undefined : (String(endedRaw).toLowerCase() === 'true');

		if (isManager) {
			if (startedFilter !== undefined && endedFilter !== undefined) {
				return res.status(400).json({ error: 'Cannot filter by both started and ended' });
			}
			if (startedFilter !== undefined) {
				// if started, then startTime <= now, if not started, then startTime > now
				where.startTime = startedFilter ? { lte: now } : { gt: now };
			}
			if (endedFilter !== undefined) {
				// if ended, then endTime <= now (already ended), if not ended, then endTime > now
				where.endTime = endedFilter ? { lte: now } : { gt: now };
			}
		} else {
			// regular users: only active promotions they haven't used
			where.startTime = { lte: now };
			where.endTime = { gte: now };
			if (user && user.utorid) {
				where.transactions = { none: { utorid: user.utorid } };
			}
		}

		// get total count and paginated results
		const count = await prisma.promotion.count({ where });

		const selectFields = {
			id: true,
			name: true,
			description: true,
			type: true,
			startTime: isManager, // only include startTime for managers
			endTime: true,
			minSpending: true,
			rate: true,
			points: true,
		};

		// sorting
		const allowedSorts = isManager
			? ['name','description','type','startTime','endTime','minSpending','rate','points','id']
			: ['name','description','endTime','points','minSpending'];
		let orderBy = undefined;
		if (sortByRaw && allowedSorts.includes(String(sortByRaw))) {
			const dir = (String(sortOrderRaw).toLowerCase() === 'desc') ? 'desc' : 'asc';
			orderBy = { [String(sortByRaw)]: dir };
		} else {
			// defaults
			orderBy = isManager ? { startTime: 'asc' } : { endTime: 'asc' };
		}

		const promotions = await prisma.promotion.findMany({
			where,
			skip: (page - 1) * limit,
			take: limit,
			select: selectFields,
			orderBy,
		});

		const results = promotions.map(p => {
			const base = {
				id: p.id,
				name: p.name,
				description: p.description,
				type: p.type,
				endTime: p.endTime,
				minSpending: p.minSpending ?? null,
				rate: p.rate ?? null,
				points: p.points ?? 0,
			};
			if (isManager) base.startTime = p.startTime;
			return base;
		});

		return res.status(200).json({ count, results });
	} catch (err) {
		console.error('Error listing promotions:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// GET /promotions/:promotionId: Retrieve a single promotion
router.get('/:promotionId', async (req, res) => {
    try {
        const id = Number(req.params.promotionId);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Invalid promotionId' });
        }

        const promo = await prisma.promotion.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        if (!promo) return res.status(404).json({ error: 'Promotion not found' });

		const now = new Date();

		const user = req.user;
		const isManager = (user && ['manager', 'superuser'].includes(user.role));

		if (!isManager) {
			// 404 if promotion is inactive for regular users
			if (promo.startTime > now || promo.endTime < now) {
				return res.status(404).json({ error: 'Promotion not found' });
			}
		}

		return res.status(200).json({
			id: promo.id,
			name: promo.name,
			description: promo.description,
			type: promo.type,
			startTime: promo.startTime,
			endTime: promo.endTime,
			minSpending: promo.minSpending ?? null,
			rate: promo.rate ?? null,
			points: promo.points ?? 0,
		});
    } catch (err) {
        console.error('Error getting promotion:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /promotions/:promotionId: Update an existing promotion
router.patch('/:promotionId', async (req, res) => {
    try {
        const user = req.user;

        // check for clearance (must be manager or higher)
        if (!user || !['manager', 'superuser'].includes(user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const id = Number(req.params.promotionId);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Invalid promotion id' });
        }

	const promo = await prisma.promotion.findUnique({ where: { id } });
	if (!promo) return res.status(404).json({ error: 'Promotion not found' });

        const now = new Date();
        const origStart = new Date(promo.startTime);
        const origEnd = new Date(promo.endTime);

        const {
            name,
            description,
            type,
            startTime: startTimeRaw,
            endTime: endTimeRaw,
            minSpending,
            rate,
            points,
        } = req.body || {};

        // If no updatable fields provided
        const providedFields = ['name','description','type','startTime','endTime','minSpending','rate','points'].filter(f => Object.prototype.hasOwnProperty.call(req.body || {}, f));
		if (providedFields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        // No updates allowed after promotion has started
        const disallowedAfterStart = ['name','description','type','startTime','minSpending','rate','points'];
        if (now > origStart && origEnd > now) {
            for (const f of disallowedAfterStart) {
                if (Object.prototype.hasOwnProperty.call(req.body || {}, f) && req.body[f] !== null) {
                    return res.status(400).json({ error: `Cannot update ${f} after promotion has started` });
                }
            }
        }

        // No updates allowed to endTime after promotion has ended
        if (now > origEnd && Object.prototype.hasOwnProperty.call(req.body || {}, 'endTime') && req.body.endTime !== null) {
            return res.status(400).json({ error: 'Cannot update end time after promotion has ended' });
        }

        let newStart = undefined;
        let newEnd = undefined;
        if (startTimeRaw !== undefined && startTimeRaw !== null) {
            newStart = new Date(startTimeRaw);
            if (isNaN(newStart.getTime())) return res.status(400).json({ error: 'Invalid start time' });
            if (newStart < now) return res.status(400).json({ error: 'start time must not be in the past' });
        }
        if (endTimeRaw !== undefined && endTimeRaw !== null) {
            newEnd = new Date(endTimeRaw);
            if (isNaN(newEnd.getTime())) return res.status(400).json({ error: 'Invalid endTime' });
            if (newEnd < now) return res.status(400).json({ error: 'end time must not be in the past' });
        }

        // Validate that endTime is after startTime
        const effectiveStart = newStart !== undefined ? newStart : new Date(promo.startTime);
        const effectiveEnd = newEnd !== undefined ? newEnd : new Date(promo.endTime);
        if (effectiveEnd <= effectiveStart) return res.status(400).json({ error: 'end time must be after start time' });

		const updateData = {};
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) {
			if (name !== null) {
				if (typeof name !== 'string' || name.trim() === '') return res.status(400).json({ error: 'Invalid name' });
				updateData.name = name;
			}
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'description')) {
			if (description !== null) {
				if (typeof description !== 'string') return res.status(400).json({ error: 'Invalid description' });
				updateData.description = description;
			}
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'type')) {
			if (type !== null) {
				if (typeof type !== 'string') return res.status(400).json({ error: 'Invalid type' });
				let normalized = type.toLowerCase();
				if (normalized === 'one-time') normalized = 'onetime';
				if (!['automatic','onetime'].includes(normalized)) return res.status(400).json({ error: 'Invalid type' });
				updateData.type = normalized;
			}
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'startTime')) {
			if (startTimeRaw !== null && newStart !== undefined) updateData.startTime = newStart;
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'endTime')) {
			if (endTimeRaw !== null && newEnd !== undefined) updateData.endTime = newEnd;
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'minSpending')) {
			if (minSpending === null) {
				updateData.minSpending = null;
			} else {
				if (typeof minSpending !== 'number' || Number(minSpending) <= 0) return res.status(400).json({ error: 'minSpending must be a positive number' });
				updateData.minSpending = Math.round(minSpending);
			}
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'rate')) {
			if (rate === null) {
				updateData.rate = null;
			} else {
				if (typeof rate !== 'number' || Number(rate) <= 0) return res.status(400).json({ error: 'rate must be a positive number' });
				updateData.rate = rate;
			}
		}
		if (Object.prototype.hasOwnProperty.call(req.body || {}, 'points')) {
			if (points === null) {
				updateData.points = null;
			} else {
				if (typeof points !== 'number' || !Number.isInteger(points) || points < 0) return res.status(400).json({ error: 'points must be a non-negative integer' });
				updateData.points = points;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(200).json({
				id: promo.id,
				name: promo.name,
				type: promo.type,
				description: promo.description,
				startTime: promo.startTime,
				endTime: promo.endTime,
				minSpending: promo.minSpending ?? null,
				rate: promo.rate ?? null,
				points: promo.points ?? 0,
			});
		}

        const updated = await prisma.promotion.update({ where: { id }, data: updateData });

        // Besides id,name,type, include only fields that were updated
		const resp = {
			id: updated.id,
			name: updated.name,
			type: updated.type,
			description: updated.description,
			startTime: updated.startTime,
			endTime: updated.endTime,
			minSpending: updated.minSpending ?? null,
			rate: updated.rate ?? null,
			points: updated.points ?? 0,
		};

		return res.status(200).json(resp);
    } catch (err) {
        console.error('Error updating promotion:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /promotions/:promotionId: Remove a promotion
router.delete('/:promotionId', async (req, res) => {
	try {
		const user = req.user;

        // check for clearance (must be manager or higher)
		if (!user || !['manager', 'superuser'].includes(user.role)) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		const id = Number(req.params.promotionId);
		if (!Number.isInteger(id) || id < 1) {
			return res.status(400).json({ error: 'Invalid promotionId' });
		}

		const promo = await prisma.promotion.findUnique({ where: { id } });
		if (!promo) return res.status(404).json({ error: 'Promotion not found' });

		const now = new Date();
		const start = new Date(promo.startTime);
		const end = new Date(promo.endTime);

		// cannot delete if already started
		if (start <= now && end >= now) {
			return res.status(403).json({ error: 'Cannot delete a promotion that has already started' });
		}

		await prisma.promotion.delete({ where: { id } });
		return res.status(204).send();
	} catch (err) {
		console.error('Error deleting promotion:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
