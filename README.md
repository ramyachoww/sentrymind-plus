# 🛡️ SentryMind+

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg?style=for-the-badge)](https://sentrymind-plus.vercel.app/)
[![Vercel](https://img.shields.io/badge/deployed-vercel-black.svg?style=for-the-badge)](https://sentrymind-plus.vercel.app/)

> **SentryMind+** is a secure, offline-first mental wellness web application custom-designed for soldiers and tactical personnel. It combines advanced AI-guided therapy, biometric tracking, gamified mental fitness, and robust local privacy to support those serving in high-stress environments.

🔗 **Live Application Link**: [https://sentrymind-plus.vercel.app/](https://sentrymind-plus.vercel.app/)

---

## 🌟 Key Features

### 1. 🤖 Adaptive AI Therapist (SentryMind Chat)
* Powered by the **Google Gemini API** to provide cognitive-behavioral support and active listening.
* Context-aware, empathetic conversations tailored specifically for military contexts, combat stress, and deployment challenges.
* Designed to act as an immediate mental first-aid tool.

### 2. 📊 Mood & Wellness Tracking
* **Daily Mood Check-in**: A comprehensive log capturing emotion, stress levels, physical tiredness, and contributing environmental factors.
* **Biometric Synchronization**: A mock integration with tactical smartwatches to automatically sync heart rate, steps, and sleep cycles.
* **Interactive Mood Charts**: Beautiful visualizations of mood trends and wellness metrics over time to help users identify triggers and patterns.

### 3. 🧘 Mental Fitness & Mindfulness Exercises
* Guided breathing exercises (including tactical box breathing).
* Guided body scans and physical decompression routines.
* Mindfulness techniques optimized for focus and stress reduction in tactical situations.

### 4. 🎮 Gamified Decompression (Mindfulness Games)
Five custom-built interactive mini-games designed to stimulate positive cognitive pathways, reduce anxiety, and promote calm:
* **Memory Calm Match**: A soothing memory card matching game with relaxing visuals.
* **Focus Bubble Pop**: A mindful bubble-popping exercise to train visual focus and tempo.
* **Gratitude Catcher**: An interactive catching game where users collect positive thoughts and gratitude factors.
* **Zen Garden Builder**: A creative canvas allowing users to arrange stones and rake sand to clear their minds.
* **Color Flow**: A fluid, interactive color-mixing puzzle designed for sensory relaxation.

### 5. 🎯 Gamified Missions & Rewards (Treasure Box)
* **Daily Missions**: Interactive challenges (e.g., "Log sleep," "Complete a breathing session") to build positive habits.
* **Wellness Coins**: A reward currency earned by maintaining streaks and completing wellness milestones.
* **Treasure Box**: Unlock badges, achievements, and upgrades to customize the wellness dashboard.

### 6. 🔒 Offline-First & Tactical Security
* Fully functional offline using local browser storage (`localStorage`) to guarantee privacy and operability in zero-connectivity environments.
* Military-grade aesthetic with built-in secure local login.
* No external tracking or data sharing, ensuring absolute confidentiality for sensitive personnel.

---

## 🛠️ Technical Stack

* **Frontend**: React 19 (TypeScript), TailwindCSS
* **Build Tool**: Vite 6
* **AI Integration**: Google GenAI SDK (`@google/genai`)
* **State Management**: React Context API
* **Local Persistence**: Offline-first HTML5 LocalStorage

---

## 🚀 Running Locally

Follow these steps to run the application on your local machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ramyachoww/sentrymind-plus.git
   cd sentrymind-plus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Key**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Note: For local preview, you can also modify the fallback key in `index.html` as needed.)*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Deployment

The application is configured for seamless deployment on **Vercel** or **Netlify**. 

To deploy to Vercel:
1. Connect your GitHub repository to Vercel.
2. Configure the build settings (Vite default: Build command `npm run build`, Output directory `dist`).
3. Add the `VITE_GEMINI_API_KEY` environment variable in the Vercel dashboard.
4. Deploy!
