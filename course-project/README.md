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

## 📷 Website Screenshots

### 🔐 Login Page
<p align="center">
  <img src="https://github.com/user-attachments/assets/cfdc7d56-cd18-403b-9eef-ff1037e0cd27"
       alt="Login Page"
       width="700" />
</p>

---

### 🏠 Landing Page (Regular User)
<p align="center">
  <img src="https://github.com/user-attachments/assets/4f5f8fa6-3daf-4bca-9980-c8ede3b6807d"
       alt="Landing Page for Regular User"
       width="100%" />
</p>

---

### 📊 Transactions Page (Manager User)
<p align="center">
  <img src="https://github.com/user-attachments/assets/0a3b2be4-df5c-4596-bace-c43ca0b66ea5"
       alt="Transactions Page for Manager User"
       width="100%" />
</p>

---

### 📅 Events Page (Manager User)
<p align="center">
  <img src="https://github.com/user-attachments/assets/665e3521-03fc-4f6d-a4ac-be704b386de9"
       alt="Events Page for Manager User"
       width="100%" />
</p>

---

### 📈 Analytics Page (Manager User)
<p align="center">
  <img src="https://github.com/user-attachments/assets/80749cd7-c533-47b3-8319-daf46e0180fc"
       alt="Analytics Page for Manager User"
       width="100%" />
</p>


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

---
## **DevOps / Deployment**
- **Railway** – Platform used to deploy the backend server and host the PostgreSQL database.
- **Nodemon** – Development tool for automatic backend restarts during coding.







