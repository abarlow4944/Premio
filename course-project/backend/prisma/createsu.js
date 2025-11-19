/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
	const prisma = new PrismaClient();

	const args = process.argv.slice(2);
	if (args.length < 3) {
		console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
		process.exit(1);
	}

	const [utorid, email, plainPassword] = args;

	try {
		const cost = 10; // bcrypt cost factor
		const hashed = await bcrypt.hash(plainPassword, cost);

		const user = await prisma.user.create({
			data: {
				utorid,
				name: utorid,
				email: email,
				password: hashed,
				role: 'superuser',
				verified: true,
				activated: true,
				suspicious: false,
			},
		});

		console.log('Superuser created:');
		console.log({ id: user.id, utorid: user.utorid, email: user.email, role: user.role });
	} catch (err) {
		console.error('Error creating superuser:', err.message || err);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
