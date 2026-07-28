
### 2. `README.md`

Create a file named `README.md` in your **root folder**:

```markdown
# Enterprise GIS AI Assistant (Google ADK + ArcGIS)

An end-to-end full-stack prototype integrating **Google Agent Development Kit (ADK)** with **ArcGIS Maps SDK for JavaScript** and an **Express** backend. The assistant allows users to query SAP asset locations via natural language and automatically renders dynamic markers on an interactive Web Map.

---

## 🏗️ Architecture Overview


```

[ Frontend (Client) ] ─── POST /api/chat ───> [ Express Backend (Server) ]
ArcGIS Web Map                                    │
Interactive Chat                                  ├── Google ADK Runner
├── Gemini 2.5 Flash Model
└── SAP Asset Function Tool

```

- **Frontend (`/client`):** Interactive mapping client rendering spatial asset markers via the ArcGIS Maps SDK.
- **Backend (`/server`):** Express Node.js server wrapping a Google ADK `LlmAgent` and `Runner` with session state management and custom tool execution (`FunctionTool`).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js:** `v18.11+` recommended
- **Gemini API Key:** Obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 1. Backend Setup (`/server`)

1. Navigate to the server directory:
   ```bash
   cd server

```

2. Install dependencies:
```bash
npm install

```


3. Create a `.env` file in the `server` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000

```


4. Start the development server (with hot reload):
```bash
npm run dev

```


*The server will run on `http://localhost:3000`.*

---

### 2. Frontend Setup (`/client`)

1. Open a new terminal and navigate to the client directory:
```bash
cd client

```


2. Install dependencies:
```bash
npm install

```


3. Start the Vite development server:
```bash
npm run dev

```



---

## 🧪 Usage Example

1. Open the front-end application in your browser.
2. Enter a natural language prompt in the chat panel, for example:
> *"Where is SAP asset PUMP-101 located and what is its status?"*


3. The ADK Agent will trigger the SAP database tool, summarize the asset status in text, and plot the returned coordinates (**34.0522, -118.2437**) on the ArcGIS Web Map.

---

## 🛠️ Project Structure

```
.
├── client/          # Front-end web map application (ArcGIS JS SDK)
├── server/          # Express backend running Google ADK LlmAgent
├── .gitignore       # Root Git ignore rules
└── README.md        # Project documentation

```

```

---

### Next Steps for Git Initialization:

Run these commands in your **root folder** to commit and push to GitHub:

```powershell
git init
git add .
git commit -m "Initial commit: GIS AI Assistant backend and frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main

```