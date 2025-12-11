## 🏆 Premio
Premio is a customer loyalty program that enables users to accumulate and redeem points for purchases/free items, similar to PC Optimum. The application supports three distinct user roles:
- **Regular users:** have the ability to make point redemption requests, transfer points to other users, RSVP to events, etc.
- **Cashier users:** have the ability to create transactions for regular users and complete point redemption requests, etc.
- **Manager users:** have the ability to view, create, and edit users, transactions, events, promotions, as well as view analytics, etc.

Check out Premio here!: https://premio.up.railway.app/

**Demo Credentials:**
- SuperUser: chenpa7, Password1!
- Manager: zhaoxi8, Password1!
- Cashier: qiaohui2, Password1!
- Regular: alicex1, Password1!

## 🌟 Features
Available features vary depending on user role. However, features include:
- Creating, viewing, editing, and deleting users, transactions, promotions, events etc.
- RSVPing to events, as well as adding guests and event organizers. Event organizers can award points to event guests.
- Role switching for higher-ups, such that cashiers and managers can also collect and redeem points as regular users, for example.
- Point redemptions and transfers.
- Profile management (changing name, birthday, password, etc)
- Password reset emails (forgot password)
- Account activation emails (managers can register new users)
- Unique QR code for every regular user for user identification.
- Pagination, filtering, and ordering for data tables.

---

## 🛠️ Technologies Used
## **Frontend**
- **React** – Component-based UI framework used for building interactive pages and user flows.
- **Vite** – Development server and build tool providing fast HMR and optimized production builds.
- **TailwindCSS** – Utility-first CSS framework used for rapid styling.
- **TanStack** – Used for building the main DataTable component.
- **React Router** – Client-side routing for navigation between pages.
- **Recharts** – Library used for charts and data visualization on Analytics page.
- **React-QR-Code** – Generates QR codes where needed in the UI.

## **Backend**
- **Node.js** – JavaScript runtime used to execute the backend application.
- **Express.js** – Web framework used for routing, middleware, authentication, and API endpoints.
- **SendGrid API** – Used for sending automated emails for account activation and password reset.
- **bcrypt** – Used for hashing passwords for secure user authentication.
- **jsonwebtoken** – Implements JWT authentication and authorization. HttpOnly cookies used to prevent token exposure on client-side.

## **Database Layer**
- **PostgreSQL** – Primary relational database storing application data.
- **Prisma ORM** – Type-safe ORM used for:
  - Defining database schema (`schema.prisma`)
  - Generating SQL migrations
  - Type-safe database queries
  - Managing relations between models

Railway hosts the PostgreSQL database instance used in production.

## **DevOps / Deployment**
- **Railway** – Platform used to deploy the backend server and host the PostgreSQL database.
- **Nodemon** – Development tool for automatic backend restarts during coding.
