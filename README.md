# 10xCards

10xCards is a web application that uses AI to automatically generate educational flashcards from user-provided text, significantly speeding up the learning process.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Manually creating high-quality educational flashcards is a slow and laborious process. 10xCards solves this problem by leveraging AI to automate and simplify flashcard generation. Users can paste text, such as lecture notes or book chapters, and the application will create flashcards for them. The app also supports manual creation and management of flashcards, all integrated with a simple spaced repetition algorithm to optimize memorization.

## Tech Stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- **Backend & Database**: Supabase, PostgreSQL
- **AI Integration**: OpenRouter.ai
- **Infrastructure & CI/CD**: GitHub, GitHub Actions, DigitalOcean App Platform

## Getting Started Locally

To set up and run the project locally, follow these steps:

### Prerequisites

- Node.js version `22.14.0`
- A package manager like `npm` or `yarn`
- A Supabase account for database and authentication

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/zacol/10x-cards.git
    cd 10x-cards
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your Supabase project URL and anon key:

    ```env
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run the following scripts:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the project files.
- `npm run lint:fix`: Lints and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

The current version of the project includes the following features:

- User authentication (email and password).
- AI-powered flashcard generation from text.
- Manual creation, editing, and deletion of flashcards.
- A central "Library" to view all flashcards.
- A learning session with a spaced repetition algorithm.

The following features are intentionally out of scope for the current version:

- Importing flashcards from files (e.g., PDF, CSV).
- Organizing flashcards into decks.
- Sharing flashcards between users.
- Dedicated mobile applications.

## Project Status

**Version:** 0.0.1

This project is currently in the initial development phase.

## License

This project is licensed under the MIT License.
