# BidArena – Frontend

This is the **Frontend application** for the **Cricket Auction Platform**, built using **React**.
It provides an **Organizer Dashboard** to manage tournaments, teams, and eventually the live auction process.

The frontend communicates with the **Node.js + Express + Prisma backend API** to perform CRUD operations and manage auction data.

---

# 🚀 Tech Stack

* **React** – UI Library
* **React Router** – Routing
* **Axios** – API requests
* **Tailwind CSS** – UI styling
* **JWT Authentication** – Secure API access
* **React Hooks** – State & lifecycle management

<!-- ---

# 📁 Project Structure

```
src
│
├── components
│   └── layout
│       └── Sidebar.jsx
│
├── pages
│   ├── teams
│   │   ├── TeamsPage.jsx
│   │   └── AddTeam.jsx
│   │
│   └── tournaments
│       ├── TournamentsPage.jsx
│       └── AddTournament.jsx
│
├── services
│   ├── teamService.js
│   └── tournamentService.js
│
├── routes
│   └── AppRoutes.jsx
│
└── App.js
``` -->

---

# ⚙️ Installation

### 1️⃣ Clone the repository

```
git clone https://github.com/Apurv3027/BidArena.git
```

### 2️⃣ Navigate to project folder

```
cd BidArena
```

### 3️⃣ Install dependencies

```
npm install
```

### 4️⃣ Start development server

```
npm run dev
```

Application will start on:

```
http://localhost:5173
```

---

# 🔐 Authentication

The application uses **JWT token authentication**.

After login, the token is stored in:

```
localStorage
```

and sent in API requests:

```
Authorization: Bearer <token>
```

---

# 📡 API Integration

Frontend connects to backend APIs such as:

### Tournaments

```
GET    /api/tournaments
POST   /api/tournaments/create
```

### Teams

```
GET    /api/teams/organizer
POST   /api/teams/create
PUT    /api/teams/:id
DELETE /api/teams/:id
```

---

# 🧑‍💼 Organizer Features

The Organizer Dashboard allows:

### Tournament Management

* Create tournament
* View tournament list

### Team Management

* Create team
* Upload team logo
* View teams
* Edit team
* Delete team

---

# 🎨 UI Features

* Modern **dark theme dashboard**
* **Responsive layout**
* **Image preview for team logos**
* **Loading states**
* **Clean data tables**

---

# 🔮 Upcoming Features

The platform will include advanced features such as:

* Player management
* Live auction room
* Real-time bidding using **Socket.io**
* Team purse tracking
* Player bidding history
* Auction timer
* Admin dashboard

---

# 🤝 Contributing

1. Fork the repository
2. Create a new feature branch

```
git checkout -b feature/your-feature-name
```

3. Commit your changes

```
git commit -m "Add new feature"
```

4. Push to branch

```
git push origin feature/your-feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is built for **learning and development purposes**.

---

# 👨‍💻 Author

Developed by **Apurv Patel**

<!-- Full Stack Developer

* Laravel
* Flutter
* React
* Node.js -->

---

# ⭐ Support

If you like this project, consider giving it a **star on GitHub ⭐**