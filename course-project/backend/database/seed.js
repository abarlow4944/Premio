'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDatePastMonths(months = 4) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30 * months);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

async function getOrCreatePromotion(p) {
  const found = await prisma.promotion.findFirst({ where: { name: p.name } });
  if (found) return found;
  return prisma.promotion.create({ data: p });
}

async function getOrCreateEvent(e) {
  const found = await prisma.event.findFirst({ where: { name: e.name } });
  if (found) return found;
  return prisma.event.create({ data: e });
}

async function seedData() {
  try {
    const users = [
      { utorid: 'alicex1', name: 'Alice Bennett', email: 'alice.bennett@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 120, birthday: '1998-03-15' },
      { utorid: 'bobbyj2', name: 'Bob Chen', email: 'bob.chen@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 80, birthday: '1999-07-22' },
      { utorid: 'johnny3', name: 'John Doe', email: 'john.doe@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 200, birthday: '1997-11-08' },
      { utorid: 'qiaohui2', name: 'Cindy Qiao', email: 'hui.qiao@mail.utoronto.ca', password: 'Password1!', role: 'cashier', verified: true, activated: true, points: 5, suspicious: true, birthday: '1996-05-20' },
      { utorid: 'barlowa2', name: 'Alicia Barlow', email: 'alicia.barlow@mail.utoronto.ca', password: 'Password1!', role: 'cashier', verified: true, activated: true, points: 65, birthday: '2000-01-10' },
      { utorid: 'chengel6', name: 'Elia Cheng', email: 'elia.cheng@mail.utoronto.ca', password: 'Password1!', role: 'cashier', verified: true, activated: true, points: 500, birthday: '1998-09-14' },
      { utorid: 'chenpa7', name: 'Pan Chen', email: 'pan.chen@mail.utoronto.ca', password: 'Password1!', role: 'superuser', verified: true, activated: true, points: 1000, birthday: '1995-12-25' },
      { utorid: 'zhaoxi8', name: 'Xiling Zhao', email: 'xiling.zhao@mail.utoronto.ca', password: 'Password1!', role: 'manager', verified: true, activated: true, points: 30, birthday: '1997-04-03' },
      { utorid: 'emilyw9', name: 'Emily Wang', email: 'emily.wang@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 47, birthday: '1999-06-17' },
      { utorid: 'jackb10', name: 'Jack Brown', email: 'jack.brown@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 0, birthday: '2001-02-28' },
      { utorid: 'katele11', name: 'Kate Lee', email: 'kate.lee@mail.utoronto.ca', password: 'Password1!', role: 'regular', verified: true, activated: true, points: 220, birthday: '1998-08-11' },
    ];

    const createdUsers = [];
    for (const u of users) {
      try {
        const hashed = await bcrypt.hash(u.password, 10);
        const cu = await prisma.user.create({
          data: {
            utorid: u.utorid,
            name: u.name,
            email: u.email,
            role: u.role,
            verified: u.verified,
            activated: u.activated,
            suspicious: u.suspicious,
            birthday: u.birthday,
            avatarUrl: u.avatarUrl,
            password: hashed,
            points: u.points || 0,
            createdAt: getRandomDatePastMonths(4),
          },
        });
        createdUsers.push(cu);
      } catch (err) {
        console.log(`Skipping creation of user ${u.utorid}: ${err.message}`);
      }
    }

    const now = new Date();
  // helper lists of seeded users by role
  const managerUsers = createdUsers.filter(u => u.role === 'manager');
  const cashierUsers = createdUsers.filter(u => u.role === 'cashier');
    const promotionsData = [
      { name: 'Welcome Bonus', description: 'One-time welcome points for new users', type: 'automatic', startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30), points: 50, started: true, end: false },
      { name: 'Double Points Weekend', description: 'Earn +100 bonus points on purchases over $20 this weekend', type: 'onetime', startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2), minSpending: 20, points: 100, started: true, end: false },
      { name: 'Holiday Bonus', description: 'Extra 25 points for purchases during holidays', type: 'automatic', startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60), points: 25, started: true, end: false },
      { name: 'Referral Reward', description: 'Invite a friend and both get 30 points', type: 'onetime', startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 150), points: 30, started: false, end: false },
      { name: 'Big Spender Bonus', description: 'Extra points proportional to spend above $50', type: 'automatic', startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 75), minSpending: 50, rate: 0.05, points: 0, started: false, end: false },
      { name: 'Student Saver', description: 'Small discount + small points bonus for students', type: 'automatic', startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30), endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60), rate: 0.02, points: 10, started: false, end: false },
    ];

    const promotions = [];
    for (const p of promotionsData) {
      const pr = await getOrCreatePromotion(p);
      promotions.push(pr);
    }

    const eventsData = [
    {
      name: '20x Points Weekend',
      description: 'Earn 20x the points on all beauty and personal care products.',
      location: 'All Participating Stores',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      capacity: 5000,
      pointsRemain: 5000,
      pointsAwarded: 500,
      published: true
    },
    {
      name: 'Digital Offers Week',
      description: 'Load your personalized offers through the app and earn bonus points.',
      location: 'Mobile App',
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
      capacity: 99999,
      pointsRemain: 99999,
      pointsAwarded: 200,
      published: true
    },
    {
      name: 'Grocery Bonus Event',
      description: 'Earn 5000 bonus points when you spend $30 or more on groceries.',
      location: 'All Participating Stores',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
      capacity: 99999,
      pointsRemain: 99999,
      pointsAwarded: 5000,
      published: true
    },
    {
      name: 'Pharmacy Essentials Promo',
      description: 'Earn 10x points on over-the-counter medications and wellness products.',
      location: 'Pharmacy Department',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8),
      capacity: 99999,
      pointsRemain: 99999,
      pointsAwarded: 350,
      published: true
    },
    {
      name: 'Household Essentials Deal',
      description: 'Earn 8000 bonus points when you spend $25 on cleaning supplies.',
      location: 'Household & Home Care',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 6),
      capacity: 99999,
      pointsRemain: 99999,
      pointsAwarded: 8000,
      published: false
    },
    {
      name: 'Mystery Bonus Points',
      description: 'Load the offer to reveal your surprise bonus points. Redeemable once.',
      location: 'Mobile App',
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 46),
      capacity: 5,
      pointsRemain: 500,
      pointsAwarded: 100,
      published: false
    }
    ];

    const events = [];
    for (const e of eventsData) {
      const ev = await getOrCreateEvent(e);
      events.push(ev);
    }

    // assign organizers for each event
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const organizer = managerUsers[i % managerUsers.length];
      try {
        await prisma.event.update({
          where: { id: ev.id },
          data: {
            organizers: { connect: { utorid: organizer.utorid } },
          },
        });
      } catch (e) {
        // ignore duplicates
      }
    }

    // create EventGuest entries for some events
    const guestUsers = createdUsers.slice(0, 8);
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const eventWithOrganizers = await prisma.event.findUnique({
        where: { id: ev.id },
        include: { organizers: true },
      });
      const organizerUtoIds = eventWithOrganizers?.organizers.map(o => o.utorid) || [];
      
      const guestCount = randomInt(3, 6);
      for (let g = 0; g < guestCount; g++) {
        const u = guestUsers[(i + g) % guestUsers.length];
        try {
          // event guest cannot be the organizer
          if (organizerUtoIds.includes(u.utorid)) continue;
          await prisma.eventGuest.create({
            data: {
              eventId: ev.id,
              utoridGuest: u.utorid,
              amount: ev.pointsAwarded || 5,
            },
          });
        } catch (e) {
          // ignore duplicates
        }
      }
    }

    // Transactions
    const txnTypes = ['purchase', 'redemption', 'adjustment', 'event', 'transfer'];
    const transactionsToCreate = [];

    for (const t of txnTypes) {
      for (let i = 0; i < 2; i++) {
        const user = createdUsers[randomInt(0, createdUsers.length - 1)];
        // ensure adjustments are created by a manager and purchases are created by a cashier
        let createdByUtorid = user.utorid;
        let processedByUtorid = user.utorid;
        if (t === 'adjustment') {
          if (managerUsers && managerUsers.length > 0) {
            const m = managerUsers[randomInt(0, managerUsers.length - 1)];
            createdByUtorid = m.utorid;
            processedByUtorid = m.utorid;
          }
        }
        if (t === 'purchase') {
          if (cashierUsers && cashierUsers.length > 0) {
            const c = cashierUsers[randomInt(0, cashierUsers.length - 1)];
            createdByUtorid = c.utorid;
            processedByUtorid = c.utorid;
          }
        }
        // for event transactions, only event organizers can assign points
        if (t === 'event') {
          const organizedEvents = await prisma.event.findMany({
            where: { organizers: { some: { utorid: user.utorid } } },
          });
          if (organizedEvents.length === 0) continue;
          const oe = organizedEvents[randomInt(0, organizedEvents.length - 1)];
          const tx = {
            utorid: user.utorid,
            type: t,
            spent: null,
            remark: `Assigned event points for ${oe.name}`,
            amount: oe.pointsAwarded || 10,
            relatedId: oe.id,
            createdBy: user.utorid,
            suspicious: false,
            processed: true,
            processedBy: user.utorid,
          };
          transactionsToCreate.push(tx);
          continue;
        }
        const base = {
          utorid: user.utorid,
          type: t,
          spent: t === 'purchase' ? parseFloat((Math.random() * 20 + 1).toFixed(2)) : null,
          remark: `${t} transaction sample`,
          amount: t === 'redemption' ? randomInt(1, 20) : randomInt(1, 200),
          relatedId: null,
          createdBy: createdByUtorid,
          suspicious: false,
          processed: true,
          processedBy: processedByUtorid,
        };
        transactionsToCreate.push(base);
      }
    }

    while (transactionsToCreate.length < 35) {
      const user = createdUsers[randomInt(0, createdUsers.length - 1)];
      const t = txnTypes[randomInt(0, txnTypes.length - 1)];
      const spent = t === 'purchase' ? parseFloat((Math.random() * 50 + 0.5).toFixed(2)) : null;
      const amount = t === 'redemption' ? randomInt(1, 50) : randomInt(1, 300);
      // ensure adjustments are created by a manager and purchases by a cashier
      let createdByUtorid = user.utorid;
      let processedByUtorid = user.utorid;
      if (t === 'adjustment') {
        if (managerUsers && managerUsers.length > 0) {
          const m = managerUsers[randomInt(0, managerUsers.length - 1)];
          createdByUtorid = m.utorid;
          processedByUtorid = m.utorid;
        }
      }
      if (t === 'purchase') {
        if (cashierUsers && cashierUsers.length > 0) {
          const c = cashierUsers[randomInt(0, cashierUsers.length - 1)];
          createdByUtorid = c.utorid;
          processedByUtorid = c.utorid;
        }
      }

      const tx = {
        utorid: user.utorid,
        type: t,
        spent,
        remark: `Sample ${t} transaction`,
        amount,
        createdBy: createdByUtorid,
        suspicious: Math.random() < 0.05,
        processed: Math.random() < 0.9,
        processedBy: processedByUtorid,
      };
      // sometimes associate with an event or promotion
      if (Math.random() < 0.25) {
        const ev = events[randomInt(0, events.length - 1)];
        tx.eventId = ev.id;
      }
      transactionsToCreate.push(tx);
    }

    // Insert transactions, connecting promotions randomly
    for (const tx of transactionsToCreate) {
      // pick 0-2 promotions to attach
      const attach = [];
      if (Math.random() < 0.4) attach.push(promotions[randomInt(0, promotions.length - 1)].id);
      if (Math.random() < 0.1) attach.push(promotions[randomInt(0, promotions.length - 1)].id);

      const createData = {
        utorid: tx.utorid,
        type: tx.type,
        spent: tx.spent,
        remark: tx.remark,
        amount: tx.amount,
        relatedId: tx.relatedId,
        createdBy: tx.createdBy,
        suspicious: tx.suspicious,
        processed: tx.processed,
        processedBy: tx.processedBy,
        eventId: tx.eventId || null,
      };

      const created = await prisma.transaction.create({ data: createData });

      if (attach.length) {
        for (const pid of attach) {
          try {
            await prisma.transaction.update({ where: { id: created.id }, data: { promotions: { connect: { id: pid } } } });
          } catch (e) {
            // ignore connect errors
          }
        }
      }
    }

    console.log('Seeding complete:');
    console.log(`  users: ${createdUsers.length}`);
    console.log(`  promotions: ${promotions.length}`);
    console.log(`  events: ${events.length}`);
    const totalTx = await prisma.transaction.count();
    console.log(`  transactions: ${totalTx}`);
  } catch (err) {
    console.error('Seed error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
