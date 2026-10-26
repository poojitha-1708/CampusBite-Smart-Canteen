# CampusBite — Smart Canteen Management System

A medium-complexity Full Stack Development mini project built with HTML5, CSS3, JavaScript, Node.js, Express.js, and MongoDB/Mongoose.

## Features

- Responsive canteen menu with categories and live search
- Shopping cart with quantity controls and automatic total calculation
- Student checkout form and persistent order records
- Order status tracking: Received, Preparing, Ready, Completed, Cancelled
- Admin login with server-side session authentication, login rate limiting, and admin-only write routes
- Admin-only add/delete menu items, availability toggles, and order status updates
- Staff dashboard with order/revenue statistics
- Menu availability toggles and sample menu seeding
- REST API with validation and error responses

> This is an academic demo. It does not process online payments and the staff dashboard has no authentication. Do not deploy publicly without adding authentication, authorization, rate limiting, and other security controls.

## Requirements

- Node.js 18 or later (LTS recommended)
- npm (included with Node.js)
- MongoDB Community Server running locally, or a MongoDB Atlas database

## Setup in VS Code

1. Extract the ZIP file.
2. Open the `CampusBite_FSD_Project` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Copy `.env.example` to a new file named `.env`.

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

6. If MongoDB is installed locally, keep this in `.env`:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/campusbite
   ```

   If using MongoDB Atlas, replace the URI with your Atlas connection string. Keep credentials private and never upload `.env` to GitHub.

7. Start MongoDB if using a local installation.
8. Start the application:

   ```bash
   npm start
   ```

9. Open **http://localhost:3000** in your browser.
10. Open **Admin login** and sign in using the credentials in `.env` (default example: `admin` / `ChangeThisPassword123!`). Change the password before use.
11. If the menu is empty, open the admin dashboard and click **Load sample menu (if empty)**.

For development with automatic restarts, use `npm run dev`.

## Project structure

```text
CampusBite_FSD_Project/
├── config/
│   └── db.js
├── controllers/
│   ├── menuController.js
│   └── orderController.js
├── models/
│   ├── MenuItem.js
│   └── Order.js
├── routes/
│   ├── menuRoutes.js
│   └── orderRoutes.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## REST API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API status |
| GET | `/api/menu` | List menu items |
| GET | `/api/menu?category=Snacks` | Filter by category |
| GET | `/api/menu?search=dosa` | Search menu by name |
| POST | `/api/menu/seed` | Insert sample menu if database is empty (admin only) |
| POST | `/api/menu` | Add a menu item (admin only) |
| PUT | `/api/menu/:id` | Update a menu item (admin only) |
| DELETE | `/api/menu/:id` | Delete a menu item (admin only) |
| GET | `/api/orders` | List recent orders (admin only) |
| GET | `/api/orders?status=Preparing` | Filter orders by status |
| POST | `/api/orders` | Place an order |
| PATCH | `/api/orders/:id/status` | Update order status (admin only) |
| GET | `/api/orders/stats` | Dashboard metrics (admin only) |

### Example: create a menu item

Send JSON to `POST /api/menu`:

```json
{
  "name": "Veg Pulao",
  "category": "Meals",
  "description": "Aromatic rice with vegetables",
  "price": 75,
  "image": "🍲",
  "available": true,
  "prepTime": 12
}
```

### Example: place an order

Send JSON to `POST /api/orders`:

```json
{
  "customerName": "Ananya Rao",
  "studentId": "24CS012",
  "pickupNote": "Less spicy",
  "items": [
    { "menuItem": "REPLACE_WITH_MENU_ITEM_ID", "quantity": 2 }
  ]
}
```

Use an actual `_id` returned by `GET /api/menu`.

## Database collections

- `menuitems`: dish name, category, description, price, availability, preparation time
- `orders`: customer details, purchased items, total amount, status, timestamps

## Troubleshooting

- **`npm` is not recognized:** Install Node.js LTS, restart VS Code, then run `node -v` and `npm -v`.
- **MongoDB connection error:** Check MongoDB service status and the `MONGODB_URI` in `.env`.
- **Port 3000 is busy:** Set `PORT=3001` in `.env`, restart, and open `http://localhost:3001`.
- **No menu items:** Use the Staff dashboard's sample-menu button.
- **API error:** Visit `http://localhost:3000/api/health` and check the VS Code terminal.

## Suggested demonstration

1. Open the menu and filter by category.
2. Search for a dish and add two items to the cart.
3. Place an order with a student name.
4. Open the Staff dashboard and change its status to Preparing, then Ready.
5. Toggle a dish's availability and verify that it disappears from the student menu.
6. Explain the frontend, REST API, controllers, Mongoose models, and MongoDB collections.

## Academic project report outline

1. Title and abstract
2. Introduction and problem statement
3. Objectives and scope
4. Hardware/software requirements
5. Technologies used
6. System architecture and project structure
7. Database design
8. REST API design
9. Implementation and screenshots
10. Testing and results
11. Limitations and future enhancements
12. Conclusion


## Admin authentication

- Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a long random `SESSION_SECRET` in `.env`.
- The staff dashboard is shown only after successful login.
- Express session data is stored in MongoDB and protected with an HTTP-only cookie.
- Menu creation, updates, deletion, sample seeding, order listing, dashboard metrics, and order status updates require an authenticated admin session.
- Students can still read the menu and place orders without logging in.
- Change the example admin password before using the project beyond a local demo. For public production deployments, use HTTPS and add CSRF protections, secure deployment settings, and a proper account management process.
