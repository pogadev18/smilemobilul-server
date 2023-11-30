# Smilemobilul Backend Service

## Overview

This Node.js application provides the backend service for Smilemobilul, a platform offering mobile dental clinic services. It handles company management, campaign orchestration, service day scheduling, time slot management, employee registration, and booking management.

## Getting Started

### Prerequisites

- Node.js
- npm / pnpm (Node Package Manager)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/pogadev18/transactions-journal-server.git
   ```
<br/>

2. Install NPM packages
    ```pnpm install```
<br/>
3. Create a `.env` file in the root of the projectand add the following environment variables:
    ```
    PORT=8080
    DATABASE_URL=your_database_connection_string
    ``````
<br/>

4. Runn the application
    `pnpm run dev`
<br/>

### Features
- ***Company Management***: Create, retrieve, update, and delete companies.
- ***Campaign Management***: Create and manage campaigns including setting registration periods.
- ***Service Day Management***: Add service days to campaigns.
- ***Time Slot Management***: Manage time slots for service days.
- ***Employee Registration***: Handle employee registrations with GDPR consent.
- ***Booking Management***: Manage bookings for time slots.

### Security and Performance
- CORS enabled for handling resources from different origins.
- Helmet for setting various HTTP headers for security.
- Morgan for logging HTTP requests.
- Graceful shutdown for handling termination signals
<br/>

### Error Handling
Global error handling is implemented to catch and manage errors from across the application, ensuring a consistent error response format.