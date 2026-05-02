# Notification System

A backend project for a campus notification platform with a **priority inbox** feature. The application fetches notifications from a protected external API, ranks them by **type priority** and **recency**, and returns the top 10 unread notifications efficiently.

## Features

* Custom **logging middleware** integrated at the start of the request lifecycle
* Fetches notifications from a protected external API
* Priority ranking based on:

  * Placement > Result > Event
  * Recency as a tie-breaker
* Efficient **Top-K selection** using a **Min Heap**
* Clean layered architecture:

  * routes
  * controllers
  * services
  * utils
  * middleware
* Markdown documentation covering system design stages

## Tech Stack

* Node.js
* Express.js
* Axios
* UUID

## Project Structure

```bash
notification-system/
├── src/
│   ├── config/
│   │   └── constants.js
│   ├── controllers/
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── logger.js
│   ├── routes/
│   │   └── notificationRoutes.js
│   ├── services/
│   │   └── notificationService.js
│   ├── utils/
│   │   └── priority.js
│   ├── app.js
│   └── server.js
├── notification_system_design.md
├── package.json
└── README.md
```

## Requirements

* Node.js 18+
* npm
* Access to the protected notifications API
* A valid access token stored in environment variables

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file in the project root

```env
ACCESS_TOKEN=your_access_token_here
PORT=3001
```

3. Start the server

```bash
npm start
```

## API Usage

### Get Priority Notifications

```http
GET /api/v1/notifications/priority
```

Example:

```bash
curl http://localhost:3001/api/v1/notifications/priority
```

## How Priority Works

Notifications are ranked using a score derived from:

1. **Notification type weight**

   * Placement = highest
   * Result = medium
   * Event = lowest

2. **Timestamp**

   * More recent notifications are ranked higher within the same type

The application keeps only the top 10 notifications using a **Min Heap**, which makes the selection efficient for large datasets.

## Complexity

* Time: `O(n log k)`
* Space: `O(k)`

Where `n` is the number of notifications and `k = 10`.

## Logging Middleware

The request logger is enabled globally before route handling. It records:

* request ID
* HTTP method
* route
* response status
* response time

## Screenshots

Add your output screenshots in a folder such as:

```bash
screenshots/
```

Recommended screenshots:

* Postman request
* API response showing priority notifications
* Terminal logs showing middleware output

## Notes

* Do not hard-code access tokens in source files.
* Keep sensitive credentials in `.env`.
* The design document is available in `notification_system_design.md`.

## License

This project was created for an evaluation task.