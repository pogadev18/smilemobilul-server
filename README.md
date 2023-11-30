# Smilemobilul Backend Service

## Overview

This Node.js application provides the backend service for Smilemobilul, a platform offering mobile dental clinic services. It handles company management, campaign orchestration, service day scheduling, time slot management, employee registration, and booking management.

## Getting Started

### Prerequisites

- Node.js
- npm / pnpm (Node Package Manager)
- PostgreSQL database

### Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/pogadev18/transactions-journal-server.git
    ```

    <br/>

2.  Install NPM packages
    `pnpm install`
    <br/>
3.  Create a `.env` file in the root of the projectand add the following environment variables:

        ```
        PORT=8080
        DATABASE_URL=your_database_connection_string
        ``````

    <br/>

4.  Runn the application
    `pnpm run dev`
    <br/>

### Features

- **_Company Management_**: Create, retrieve, update, and delete companies.
- **_Campaign Management_**: Create and manage campaigns including setting registration periods.
- **_Service Day Management_**: Add service days to campaigns.
- **_Time Slot Management_**: Manage time slots for service days.
- **_Employee Registration_**: Handle employee registrations with GDPR consent.
- **_Booking Management_**: Manage bookings for time slots.

### Security and Performance

- CORS enabled for handling resources from different origins.
- Helmet for setting various HTTP headers for security.
- Morgan for logging HTTP requests.
- Graceful shutdown for handling termination signals
  <br/>

### Error Handling

Global error handling is implemented to catch and manage errors from across the application (`asyncMiddleware.ts`), ensuring a consistent error response format.

### Graceful Shutdown in Node.js Express Application

Graceful shutdown is a best practice in server applications, ensuring that the server stops serving new requests and closes existing connections smoothly, without abruptly interrupting ongoing processes. The code snippet provided is part of a Node.js Express application and implements graceful shutdown handling.

Node.js provides a way to listen for system signals. In this case, the application listens for two types of signals: SIGINT and SIGTERM. These signals are used to notify the process that it should perform a graceful shutdown.

```
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
```